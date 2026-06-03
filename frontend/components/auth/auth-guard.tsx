"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/stores/user-store";
import { apiClient } from "@/lib/api-client";
import { UserProfile } from "@/types";
import { toast } from "sonner";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRoles?: string[];
}

export function AuthGuard({
  children,
  requireAuth = true,
  requiredRoles,
}: AuthGuardProps) {
  const { isLoaded: clerkLoaded, isSignedIn, userId, getToken, signOut } = useAuth();
  const { user: clerkUser } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const { profile, setProfile, clear: clearUserStore } = useUserStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  
  // Track sync retries to prevent loops
  const syncAttemptRef = useRef(0);
  const MAX_RETRIES = 4;

  // 1. Multi-Tab Session Synchronization & Auto-Recovery
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "mindrift_auth_event" && e.newValue === "logout") {
        console.log("🔄 Logout event detected in another tab. Syncing session.");
        clearUserStore();
        router.push("/sign-in");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [clearUserStore, router]);

  // Sync profile from backend database
  const syncProfileWithRetry = async (retryCount = 0): Promise<UserProfile> => {
    const token = await getToken();
    if (!token) {
      throw new Error("Clerk authentication token unavailable.");
    }

    try {
      console.log(`🔄 Syncing user profile with Spring backend (attempt ${retryCount + 1})...`);
      const response = await apiClient<UserProfile>("/users/sync", {
        method: "POST",
        token,
      });
      return response;
    } catch (err: any) {
      if (retryCount < MAX_RETRIES) {
        const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 200; // Exponential backoff + jitter
        console.warn(`⚠️ Sync failed. Retrying in ${delay.toFixed(0)}ms...`, err);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return syncProfileWithRetry(retryCount + 1);
      }
      throw err;
    }
  };

  // 2. Main Authentication & Sync Pipeline
  useEffect(() => {
    if (!clerkLoaded) return;

    if (!isSignedIn) {
      if (requireAuth) {
        console.log("🔒 Access denied. Redirecting unauthenticated user to /sign-in");
        clearUserStore();
        router.push(`/sign-in?redirect_url=${encodeURIComponent(pathname)}`);
      }
      return;
    }

    // Signed in but no profile in Zustand? Sync immediately
    if (isSignedIn && !profile && !isSyncing && syncAttemptRef.current === 0) {
      const runSync = async () => {
        setIsSyncing(true);
        setSyncError(null);
        syncAttemptRef.current = 1;

        try {
          const fetchedProfile = await syncProfileWithRetry();
          setProfile(fetchedProfile);
          console.log("✅ Spring backend profile synchronized successfully:", fetchedProfile);
        } catch (err: any) {
          console.warn("❌ Sync failure after retries. Emulating fallback profile:", err);
          
          // Setup a premium fallback profile derived from the Clerk user details
          const fallbackProfile: UserProfile = {
            id: `usr_fallback_${userId}`,
            clerkId: userId || "",
            username: clerkUser?.username || clerkUser?.primaryEmailAddress?.emailAddress.split("@")[0] || "learner",
            email: clerkUser?.primaryEmailAddress?.emailAddress || "learner@mindrift.app",
            roles: ["ROLE_USER"],
            permissions: ["quizzes:read", "quizzes:create"],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          setProfile(fallbackProfile);
          
          toast.warning("Backend Offline: Fallback Session Loaded", {
            description: "Loaded a local developer mock profile so you can explore the dashboard.",
          });
        } finally {
          setIsSyncing(false);
        }
      };

      runSync();
    }
  }, [clerkLoaded, isSignedIn, profile, isSyncing, requireAuth, pathname, router, setProfile, clearUserStore]);

  // 3. User Onboarding Gate
  useEffect(() => {
    if (!clerkLoaded || !isSignedIn || !profile || isSyncing) return;

    // Check if onboarding needs to be completed
    // User is considered onboarded if username is set in profile or flag is in localStorage
    const localOnboarded = localStorage.getItem(`mindrift_onboarded_${userId}`) === "true";
    const needsOnboarding = !profile.username && !localOnboarded;

    if (needsOnboarding && pathname !== "/onboarding") {
      console.log("🚧 Onboarding incomplete. Redirecting user to /onboarding");
      router.push("/onboarding");
    } else if (!needsOnboarding && pathname === "/onboarding") {
      console.log("✅ Onboarding already completed. Forwarding to dashboard.");
      router.push("/dashboard");
    }
  }, [clerkLoaded, isSignedIn, profile, userId, pathname, router, isSyncing]);

  // 4. Role-Based Route Gate (RBAC)
  useEffect(() => {
    if (!clerkLoaded || !isSignedIn || !profile || !requiredRoles) return;

    const normalizedUserRoles = profile.roles.map((r) => r.replace(/^ROLE_/, "").toUpperCase());
    const hasRequiredRole = requiredRoles.some((role) =>
      normalizedUserRoles.includes(role.toUpperCase()) || normalizedUserRoles.includes("SUPER_ADMIN")
    );

    if (!hasRequiredRole) {
      console.warn(`🚫 Access denied. Path ${pathname} requires roles: ${requiredRoles.join(", ")}`);
      toast.error("Access Denied", {
        description: "You do not have the required security credentials to view this area.",
      });
      router.push("/dashboard");
    }
  }, [clerkLoaded, isSignedIn, profile, requiredRoles, pathname, router]);

  // --- RENDERING STATES ---

  // Loading indicator for Clerk initialization or profile sync
  if (!clerkLoaded || (isSignedIn && !profile && isSyncing)) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black gap-4">
        <div className="relative">
          <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
          <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full" />
        </div>
        <p className="text-zinc-400 text-sm font-semibold tracking-wide animate-pulse">
          Synchronizing Mindrift Profile...
        </p>
      </div>
    );
  }

  // Error recovery screen for persistent database failures
  if (syncError) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-black p-4">
        <div className="max-w-md w-full bg-zinc-950 border border-zinc-800 p-6 rounded-2xl text-center space-y-6">
          <div className="flex justify-center">
            <div className="bg-red-500/10 border border-red-500/25 p-3 rounded-2xl text-red-400">
              <ShieldAlert className="h-8 w-8" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">Synchronization Error</h3>
            <p className="text-sm text-zinc-400 leading-relaxed font-medium">
              We couldn&apos;t connect your session to the database. This might be a temporary network issue.
            </p>
          </div>
          <Button
            onClick={() => {
              syncAttemptRef.current = 0;
              window.location.reload();
            }}
            className="w-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-white font-bold h-11"
          >
            Retry Connection
          </Button>
          <button
            onClick={() => {
              localStorage.setItem("mindrift_auth_event", "logout");
              signOut().then(() => router.push("/sign-in"));
            }}
            className="text-xs text-zinc-500 font-semibold hover:text-zinc-400 block mx-auto underline"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  // Unauthenticated blocking while redirect processes
  if (requireAuth && !isSignedIn) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-700" />
      </div>
    );
  }

  // Block renders for onboard status alignment
  const localOnboarded = localStorage.getItem(`mindrift_onboarded_${userId}`) === "true";
  const isPendingOnboarding = isSignedIn && profile && !profile.username && !localOnboarded;
  if (requireAuth && isPendingOnboarding && pathname !== "/onboarding") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  // Active rendering of children
  return <>{children}</>;
}

export default AuthGuard;