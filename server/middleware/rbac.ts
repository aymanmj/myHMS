import type { Request, Response, NextFunction } from "express";

export type UserRole = 
  | "admin"
  | "doctor" 
  | "nurse"
  | "pharmacist"
  | "lab_tech"
  | "radiology_tech"
  | "receptionist";

export const ROLE_PERMISSIONS = {
  admin: {
    patients: ["read", "create", "update", "delete"],
    appointments: ["read", "create", "update", "delete"],
    admissions: ["read", "create", "update", "delete"],
    surgeries: ["read", "create", "update", "delete"],
    medications: ["read", "create", "update", "delete"],
    prescriptions: ["read", "create", "update", "delete"],
    labTests: ["read", "create", "update", "delete"],
    radiologyTests: ["read", "create", "update", "delete"],
    staff: ["read", "create", "update", "delete"],
    payroll: ["read", "create", "update", "delete"],
    invoices: ["read", "create", "update", "delete"],
  },
  doctor: {
    patients: ["read", "create", "update"],
    appointments: ["read", "create", "update"],
    admissions: ["read", "create", "update"],
    surgeries: ["read", "create", "update"],
    medications: ["read"],
    prescriptions: ["read", "create", "update"],
    labTests: ["read", "create"],
    radiologyTests: ["read", "create"],
    staff: ["read"],
    payroll: [],
    invoices: ["read"],
  },
  nurse: {
    patients: ["read", "update"],
    appointments: ["read", "update"],
    admissions: ["read", "update"],
    surgeries: ["read"],
    medications: ["read", "update"],
    prescriptions: ["read"],
    labTests: ["read"],
    radiologyTests: ["read"],
    staff: ["read"],
    payroll: [],
    invoices: [],
  },
  pharmacist: {
    patients: ["read"],
    appointments: [],
    admissions: [],
    surgeries: [],
    medications: ["read", "create", "update"],
    prescriptions: ["read", "update"],
    labTests: [],
    radiologyTests: [],
    staff: [],
    payroll: [],
    invoices: [],
  },
  lab_tech: {
    patients: ["read"],
    appointments: [],
    admissions: [],
    surgeries: [],
    medications: [],
    prescriptions: [],
    labTests: ["read", "update"],
    radiologyTests: [],
    staff: [],
    payroll: [],
    invoices: [],
  },
  radiology_tech: {
    patients: ["read"],
    appointments: [],
    admissions: [],
    surgeries: [],
    medications: [],
    prescriptions: [],
    labTests: [],
    radiologyTests: ["read", "update"],
    staff: [],
    payroll: [],
    invoices: [],
  },
  receptionist: {
    patients: ["read", "create", "update"],
    appointments: ["read", "create", "update", "delete"],
    admissions: ["read"],
    surgeries: ["read"],
    medications: [],
    prescriptions: [],
    labTests: [],
    radiologyTests: [],
    staff: [],
    payroll: [],
    invoices: ["read", "create"],
  },
} as const;

type Resource = keyof typeof ROLE_PERMISSIONS["admin"];
type Action = "read" | "create" | "update" | "delete";

export function hasPermission(
  userRole: UserRole,
  resource: Resource,
  action: Action
): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] as any;
  if (!permissions || !permissions[resource]) {
    return false;
  }
  return (permissions[resource] as Action[]).includes(action);
}

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
