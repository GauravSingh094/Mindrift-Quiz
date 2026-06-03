"use client";

import React from "react";
import { useUserStore } from "@/stores/user-store";
import { hasRole, hasPermission } from "@/lib/auth-utils";

interface RBACGuardProps {
  roles?: string | string[];
  permissions?: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * A declarative component to conditionally render parts of the UI
 * based on user Roles or Permissions.
 */
export function RBACGuard({
  roles,
  permissions,
  children,
  fallback = null,
}: RBACGuardProps) {
  const profile = useUserStore((state) => state.profile);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  if (!isAuthenticated || !profile) {
    return <>{fallback}</>;
  }

  // Check roles if specified
  if (roles) {
    const isAllowed = hasRole(profile.roles, roles);
    if (!isAllowed) {
      return <>{fallback}</>;
    }
  }

  // Check permissions if specified
  if (permissions) {
    const isAllowed = hasPermission(profile.permissions, permissions);
    if (!isAllowed) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

// Named alias wrappers for clean syntax:
interface GuardWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function HasRole({
  roles,
  children,
  fallback,
}: GuardWrapperProps & { roles: string | string[] }) {
  return (
    <RBACGuard roles={roles} fallback={fallback}>
      {children}
    </RBACGuard>
  );
}

export function HasPermission({
  permissions,
  children,
  fallback,
}: GuardWrapperProps & { permissions: string | string[] }) {
  return (
    <RBACGuard permissions={permissions} fallback={fallback}>
      {children}
    </RBACGuard>
  );
}
