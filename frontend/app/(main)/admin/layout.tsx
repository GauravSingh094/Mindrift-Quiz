"use client";

import React from "react";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requireAuth={true} requiredRoles={["ADMIN"]}>
      <div className="w-full relative">{children}</div>
    </AuthGuard>
  );
}
