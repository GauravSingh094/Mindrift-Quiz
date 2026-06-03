"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Mail, Loader2, ArrowLeft, KeyRound, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  AuthCard,
  AuthHeader,
  AuthFooter,
  AuthError,
  AuthSuccess,
} from "./auth-components";

// Schemas
const requestSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

const resetSchema = z.object({
  code: z.string().min(6, "Code must be 6 digits.").max(6, "Code must be 6 digits."),
  password: z.string().min(8, "New password must be at least 8 characters."),
});

type RequestInput = z.infer<typeof requestSchema>;
type ResetInput = z.infer<typeof resetSchema>;

export function ForgotPasswordForm() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"request" | "reset">("request");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const requestForm = useForm<RequestInput>({
    resolver: zodResolver(requestSchema),
    defaultValues: { email: "" },
  });

  const resetForm = useForm<ResetInput>({
    resolver: zodResolver(resetSchema),
    defaultValues: { code: "", password: "" },
  });

  // 1. Request Reset Code
  const onRequestSubmit = async (data: RequestInput) => {
    if (!isLoaded) return;
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: data.email,
      });

      setStep("reset");
      setSuccessMessage("Reset code has been sent! Check your inbox.");
      toast.success("Code Sent!", {
        description: `We've sent a 6-digit password reset code to ${data.email}.`,
      });
    } catch (err: any) {
      console.error("Forgot password request error:", err);
      const msg = err.errors?.[0]?.longMessage || err.message || "Failed to request password reset.";
      setErrorMessage(msg);
      toast.error("Request Failed", { description: msg });
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Reset Password using Code
  const onResetSubmit = async (data: ResetInput) => {
    if (!isLoaded) return;
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: data.code,
        password: data.password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        toast.success("Password Updated!", {
          description: "Your password has been successfully reset. You are now logged in.",
        });
        router.push("/dashboard");
      } else {
        console.warn("Clerk reset password status incomplete:", result.status);
        setErrorMessage(`Failed to complete reset: ${result.status}`);
      }
    } catch (err: any) {
      console.error("Reset password submission error:", err);
      const msg = err.errors?.[0]?.longMessage || err.message || "Failed to reset password. Please check code.";
      setErrorMessage(msg);
      toast.error("Reset Failed", { description: msg });
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "reset") {
    return (
      <AuthCard>
        <AuthHeader
          title="Reset your password"
          description="Enter the verification code and choose a secure new password."
          icon={<Lock className="h-7 w-7 text-purple-400" />}
        />

        {errorMessage && <AuthError message={errorMessage} />}
        {successMessage && <AuthSuccess message={successMessage} />}

        <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              6-Digit Reset Code
            </label>
            <Input
              type="text"
              placeholder="123456"
              maxLength={6}
              className="text-center tracking-[0.5em] text-lg font-bold bg-zinc-900/50 border-zinc-800 text-white placeholder-zinc-700 focus-visible:ring-purple-500 h-11"
              disabled={isLoading}
              {...resetForm.register("code")}
            />
            {resetForm.formState.errors.code && (
              <p className="text-xs font-semibold text-red-400 mt-1">
                {resetForm.formState.errors.code.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              New Password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              className="bg-zinc-900/50 border-zinc-800 text-white placeholder-zinc-500 focus-visible:ring-purple-500 h-11"
              disabled={isLoading}
              {...resetForm.register("password")}
            />
            {resetForm.formState.errors.password && (
              <p className="text-xs font-semibold text-red-400 mt-1">
                {resetForm.formState.errors.password.message}
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
                Resetting Password...
              </span>
            ) : (
              "Save & Sign In"
            )}
          </Button>

          <button
            type="button"
            onClick={() => setStep("request")}
            className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1.5 pt-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to request
          </button>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <AuthHeader
        title="Forgot Password?"
        description="No worries. Enter your email and we'll send you instructions to reset it."
        icon={<KeyRound className="h-7 w-7 text-purple-400 animate-bounce" />}
      />

      {errorMessage && <AuthError message={errorMessage} />}

      <form onSubmit={requestForm.handleSubmit(onRequestSubmit)} className="space-y-4">
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
              {...requestForm.register("email")}
            />
          </div>
          {requestForm.formState.errors.email && (
            <p className="text-xs font-semibold text-red-400 mt-1">
              {requestForm.formState.errors.email.message}
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
              Sending Code...
            </span>
          ) : (
            "Send Reset Instructions"
          )}
        </Button>
      </form>

      <AuthFooter
        message="Remember your credentials?"
        actionText="Back to Login"
        actionHref="/sign-in"
      />
    </AuthCard>
  );
}
