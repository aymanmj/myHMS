import { useAuth } from "./useAuth";
import { hasPermission, type UserRole, type Resource, type Action } from "@shared/permissions";

export function usePermissions() {
  const { user } = useAuth();
  const userRole = (user as any)?.role as UserRole || "receptionist";

  const checkPermission = (resource: Resource, action: Action): boolean => {
    return hasPermission(userRole, resource, action);
  };

  const hasAnyPermission = (resource: Resource, actions: Action[]): boolean => {
    return actions.some(action => checkPermission(resource, action));
  };

  const canRead = (resource: Resource) => checkPermission(resource, "read");
  const canCreate = (resource: Resource) => checkPermission(resource, "create");
  const canUpdate = (resource: Resource) => checkPermission(resource, "update");
  const canDelete = (resource: Resource) => checkPermission(resource, "delete");

  const isAdmin = userRole === "admin";
  const isDoctor = userRole === "doctor";
  const isNurse = userRole === "nurse";
  const isPharmacist = userRole === "pharmacist";
  const isLabTech = userRole === "lab_tech";
  const isRadiologyTech = userRole === "radiology_tech";
  const isReceptionist = userRole === "receptionist";

  return {
    userRole,
    hasPermission: checkPermission,
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
