"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Brain, Lock, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";
import {
  AuthCard,
  AuthHeader,
  AuthFooter,
  SocialLoginButtons,
  AuthDivider,
  AuthError,
} from "./auth-components";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

type LoginInput = z.infer<typeof loginSchema>;

export function SignInForm() {
  const { isLoaded, signIn, setActive } = useSignIn() as any;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const redirectUrl = searchParams.get("redirect_url") || "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginInput) => {
    if (!isLoaded) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await signIn.create({
        identifier: data.email,
        password: data.password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        toast.success("Welcome back!", {
          description: "Logged in successfully to your Mindrift account.",
        });
        router.push(redirectUrl);
      } else {
        // Handle secondary validation states (like MFA)
        console.warn("Clerk auth requires additional verification state:", result.status);
        setErrorMessage(`Additional authentication required: ${result.status}`);
      }
    } catch (err: any) {
      console.error("Clerk Login error:", err);
      const msg = err.errors?.[0]?.longMessage || err.message || "Invalid credentials. Please try again.";
      setErrorMessage(msg);
      toast.error("Authentication Failed", { description: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (strategy: "oauth_google" | "oauth_github") => {
    if (!isLoaded) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/onboarding",
      });
    } catch (err: any) {
      console.error("OAuth error:", err);
      const msg = err.message || "Failed to initialize social login.";
      setErrorMessage(msg);
      toast.error("OAuth Redirect Failed", { description: msg });
      setIsLoading(false);
    }
  };

  return (
    <AuthCard>
      <AuthHeader
        title="Welcome back"
        description="Access your dashboard and competitive learning portals."
        icon={<Brain className="h-7 w-7 animate-pulse" />}
      />

      {errorMessage && <AuthError message={errorMessage} />}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
            <Input
              type="email"
              placeholder="name@company.com"
              className="pl-11 bg-zinc-900/50 border-zinc-800 text-white placeholder-zinc-500 focus-visible:ring-purple-500 h-11"
              disabled={isLoading}
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-xs font-semibold text-red-400 mt-1">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
            <Input
              type="password"
              placeholder="••••••••"
              className="pl-11 bg-zinc-900/50 border-zinc-800 text-white placeholder-zinc-500 focus-visible:ring-purple-500 h-11"
              disabled={isLoading}
              {...register("password")}
            />
          </div>
          {errors.password && (
            <p className="text-xs font-semibold text-red-400 mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold h-11 shadow-lg shadow-purple-500/10 transition-all rounded-xl"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing In...
            </span>
          ) : (
            "Sign In with Email"
          )}
        </Button>
      </form>

      <AuthDivider />

      <SocialLoginButtons
        onGoogleClick={() => handleOAuthSignIn("oauth_google")}
        onGithubClick={() => handleOAuthSignIn("oauth_github")}
        isLoading={isLoading}
      />

      <AuthFooter
        message="New to Mindrift?"
        actionText="Create an account"
        actionHref="/sign-up"
      />
    </AuthCard>
  );
}
