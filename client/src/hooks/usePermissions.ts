import { useAuth } from "./useAuth";

export type UserRole = 
  | "admin"
  | "doctor" 
  | "nurse"
  | "pharmacist"
  | "lab_tech"
  | "radiology_tech"
  | "receptionist";

const ROLE_PERMISSIONS = {
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

export function usePermissions() {
  const { user } = useAuth();
  const userRole = (user as any)?.role as UserRole || "receptionist";

  const hasPermission = (resource: Resource, action: Action): boolean => {
    const permissions = ROLE_PERMISSIONS[userRole] as any;
    if (!permissions || !permissions[resource]) {
      return false;
    }
    return (permissions[resource] as Action[]).includes(action);
  };

  const hasAnyPermission = (resource: Resource, actions: Action[]): boolean => {
    return actions.some(action => hasPermission(resource, action));
  };

  const canRead = (resource: Resource) => hasPermission(resource, "read");
  const canCreate = (resource: Resource) => hasPermission(resource, "create");
  const canUpdate = (resource: Resource) => hasPermission(resource, "update");
  const canDelete = (resource: Resource) => hasPermission(resource, "delete");

  const isAdmin = userRole === "admin";
  const isDoctor = userRole === "doctor";
  const isNurse = userRole === "nurse";
  const isPharmacist = userRole === "pharmacist";
  const isLabTech = userRole === "lab_tech";
  const isRadiologyTech = userRole === "radiology_tech";
  const isReceptionist = userRole === "receptionist";

  return {
    userRole,
    hasPermission,
    hasAnyPermission,
    canRead,
    canCreate,
    canUpdate,
    canDelete,
    isAdmin,
    isDoctor,
    isNurse,
    isPharmacist,
    isLabTech,
    isRadiologyTech,
    isReceptionist,
  };
}
