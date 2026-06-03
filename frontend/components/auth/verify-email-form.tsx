"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSignUp } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { KeyRound, Loader2, ArrowLeft } from "lucide-react";
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

const verifySchema = z.object({
  code: z.string().min(6, "Verification code must be 6 digits.").max(6, "Verification code must be 6 digits."),
});

type VerifyInput = z.infer<typeof verifySchema>;

export function VerifyEmailForm() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyInput>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      code: "",
    },
  });

  const onSubmit = async (data: VerifyInput) => {
    if (!isLoaded) return;
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: data.code,
      });

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        toast.success("Verification successful!", {
          description: "Your email has been verified. Welcome to Mindrift!",
        });
        router.push("/onboarding");
      } else {
        setErrorMessage(`Verification status: ${completeSignUp.status}`);
      }
    } catch (err: any) {
      console.error("Clerk Email Verification error:", err);
      const msg = err.errors?.[0]?.longMessage || err.message || "Invalid verification code. Please try again.";
      setErrorMessage(msg);
      toast.error("Verification Failed", { description: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded) return;
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });
      setSuccessMessage("A verification code has been re-sent to your registered email.");
      toast.success("Code Sent!", {
        description: "Please check your registered email inbox.",
      });
    } catch (err: any) {
      console.error("Resend error:", err);
      const msg = err.message || "Failed to resend verification code.";
      setErrorMessage(msg);
      toast.error("Resend Failed", { description: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard>
      <AuthHeader
        title="Verify your email"
        description="Enter the verification code sent to your email address to activate your account."
        icon={<KeyRound className="h-7 w-7 text-cyan-400" />}
      />

      {errorMessage && <AuthError message={errorMessage} />}
      {successMessage && <AuthSuccess message={successMessage} />}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            6-Digit Verification Code
          </label>
          <Input
            type="text"
            placeholder="123456"
            maxLength={6}
            className="text-center tracking-[0.5em] text-lg font-bold bg-zinc-900/50 border-zinc-800 text-white placeholder-zinc-700 focus-visible:ring-purple-500 h-11"
            disabled={isLoading}
            {...register("code")}
          />
          {errors.code && (
            <p className="text-xs font-semibold text-red-400 mt-1">
              {errors.code.message}
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
              Verifying...
            </span>
          ) : (
            "Verify Email"
          )}
        </Button>
      </form>

      <div className="flex justify-between items-center text-xs font-semibold pt-1 border-t border-zinc-900/50">
        <button
          type="button"
          onClick={() => router.push("/sign-up")}
          className="text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign Up
        </button>
        <button
          type="button"
          onClick={handleResendCode}
          disabled={isLoading}
          className="text-purple-400 hover:text-purple-300 transition-colors"
        >
          Resend code
        </button>
      </div>
    </AuthCard>
  );
}
