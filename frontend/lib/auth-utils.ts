import { UserRole } from "@/types";

/**
 * Normalizes roles by removing Spring Security prefixes (e.g. ROLE_) 
 * and converting to uppercase for flexible, robust matching.
 */
export function normalizeRole(role: string): string {
  return role.replace(/^ROLE_/, "").toUpperCase();
}

/**
 * Checks if a user's roles contain any of the required roles.
 */
export function hasRole(
  userRoles: string[] | undefined | null,
  requiredRoles: string | string[]
): boolean {
  if (!userRoles || userRoles.length === 0) return false;

  const normalizedUserRoles = userRoles.map(normalizeRole);
  const requiredList = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  const normalizedRequired = requiredList.map(normalizeRole);

  // SUPER_ADMIN (or ROLE_SUPER_ADMIN) bypasses all role checks
  if (normalizedUserRoles.includes("SUPER_ADMIN")) {
    return true;
  }

  return normalizedRequired.some((req) => normalizedUserRoles.includes(req));
}

/**
 * Checks if a user's permissions contain all of the required permissions.
 */
export function hasPermission(
  userPermissions: string[] | undefined | null,
  requiredPermissions: string | string[],
  matchAll = true
): boolean {
  if (!userPermissions || userPermissions.length === 0) return false;

  const requiredList = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
  
  if (matchAll) {
    return requiredList.every((perm) => userPermissions.includes(perm));
  } else {
    return requiredList.some((perm) => userPermissions.includes(perm));
  }
}
