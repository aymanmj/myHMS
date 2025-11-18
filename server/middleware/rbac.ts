import type { Response, NextFunction } from "express";
import { hasPermission, type UserRole, type Resource, type Action } from "@shared/permissions";

export type { UserRole, Resource, Action };

export function requirePermission(resource: Resource, action: Action) {
  return (req: any, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!user || !user.role) {
      return res.status(401).json({ 
        message: "غير مصرح - Unauthorized",
        error: "No user or role found" 
      });
    }

    const userRole = user.role as UserRole;
    
    if (!hasPermission(userRole, resource, action)) {
      return res.status(403).json({ 
        message: "ممنوع - Forbidden",
        error: `الدور ${userRole} لا يملك صلاحية ${action} على ${resource}`,
        details: {
          role: userRole,
          resource,
          action,
          requiredPermission: `${resource}:${action}`
        }
      });
    }

    next();
  };
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: any, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!user || !user.role) {
      return res.status(401).json({ 
        message: "غير مصرح - Unauthorized" 
      });
    }

    const userRole = user.role as UserRole;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: "ممنوع - Forbidden",
        error: `هذه الصفحة متاحة فقط لـ: ${allowedRoles.join(", ")}`,
        details: {
          userRole,
          allowedRoles
        }
      });
    }

    next();
  };
}
