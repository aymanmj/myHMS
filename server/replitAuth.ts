// Replit Auth setup (javascript_log_in_with_replit integration)
import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

const ROLE_WHITELIST: Record<string, string> = {
  "admin@hospital.test": "admin",
  "admin@replit.com": "admin",
  "doctor@hospital.test": "doctor",
  "nurse@hospital.test": "nurse",
  "pharmacist@hospital.test": "pharmacist",
  "lab@hospital.test": "lab_tech",
  "radiology@hospital.test": "radiology_tech",
};

function getRoleFromEmail(email: string | undefined): string {
  if (!email) return "receptionist";
  return ROLE_WHITELIST[email.toLowerCase()] || "receptionist";
}

async function upsertUser(
  claims: any,
): Promise<import("@shared/schema").User> {
  const email = claims["email"];
  const sub = claims["sub"];
  
  const existingUser = await storage.getUser(sub);
  
  let role: string;
  if (claims["role"]) {
    role = claims["role"];
  } else if (existingUser && existingUser.role !== "receptionist") {
    role = existingUser.role;
  } else {
    role = getRoleFromEmail(email);
  }
  
  const user = await storage.upsertUser({
    id: sub,
    email,
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
    role,
  });
  
  return user;
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user: any = {};
    updateUserSession(user, tokens);
    
    const claims = tokens.claims();
    if (claims) {
      const dbUser = await upsertUser(claims);
      if (dbUser) {
        user.role = dbUser.role;
        user.email = dbUser.email;
        user.firstName = dbUser.firstName;
        user.lastName = dbUser.lastName;
      }
    }
    
    verified(null, user);
  };

  // Keep track of registered strategies
  const registeredStrategies = new Set<string>();

  // Helper function to ensure strategy exists for a domain
  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    if (!user.role) {
      const dbUser = await storage.getUser(user.claims.sub);
      if (dbUser) {
        user.role = dbUser.role;
        user.email = dbUser.email;
        user.firstName = dbUser.firstName;
        user.lastName = dbUser.lastName;
      }
    }
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    
    const dbUser = await storage.getUser(user.claims.sub);
    if (dbUser) {
      user.role = dbUser.role;
      user.email = dbUser.email;
      user.firstName = dbUser.firstName;
      user.lastName = dbUser.lastName;
    }
    
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
