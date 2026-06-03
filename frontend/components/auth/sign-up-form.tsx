"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSignUp } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Brain, Lock, Mail, User, Loader2, Sparkles, KeyRound, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  AuthCard,
  AuthHeader,
  AuthFooter,
  SocialLoginButtons,
  AuthDivider,
  AuthError,
  AuthSuccess,
} from "./auth-components";

// Form schemas
const signUpSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

const verifySchema = z.object({
  code: z.string().min(6, "Verification code must be 6 digits.").max(6, "Verification code must be 6 digits."),
});

type SignUpInput = z.infer<typeof signUpSchema>;
type VerifyInput = z.infer<typeof verifySchema>;

export function SignUpForm() {
  const { isLoaded, signUp, setActive } = useSignUp() as any;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form hooks
  const signUpForm = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
    },
  });

  const verifyForm = useForm<VerifyInput>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      code: "",
    },
  });

  // Submit signup details
  const onSignUpSubmit = async (data: SignUpInput) => {
    if (!isLoaded) return;
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const nameParts = data.fullName.trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    try {
      await signUp.create({
        emailAddress: data.email,
        password: data.password,
        firstName,
        lastName,
      });

      // Send the email verification code
      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });

      setVerifying(true);
      setSuccessMessage("Verification code sent! Please check your inbox.");
      toast.success("Code sent!", {
        description: `We've sent a 6-digit confirmation code to ${data.email}.`,
      });
    } catch (err: any) {
      console.error("Clerk Signup error:", err);
      const msg = err.errors?.[0]?.longMessage || err.message || "Failed to create account. Please try again.";
      setErrorMessage(msg);
      toast.error("Registration Failed", { description: msg });
    } finally {
      setIsLoading(false);
    }
  };

  // Submit OTP code
  const onVerifySubmit = async (data: VerifyInput) => {
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
        toast.success("Account verified!", {
          description: "Welcome to Mindrift! Let's get your profile set up.",
        });
        router.push("/onboarding");
      } else {
        console.warn("Clerk sign up verification status incomplete:", completeSignUp.status);
        setErrorMessage(`Verification incomplete: ${completeSignUp.status}`);
      }
    } catch (err: any) {
      console.error("Clerk Verification error:", err);
      const msg = err.errors?.[0]?.longMessage || err.message || "Invalid code. Please verify and try again.";
      setErrorMessage(msg);
      toast.error("Verification Failed", { description: msg });
    } finally {
      setIsLoading(false);
    }
  };

  // Resend code function
  const handleResendCode = async () => {
    if (!isLoaded) return;
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });
      setSuccessMessage("A fresh code has been sent to your email.");
      toast.success("Code re-sent!", {
        description: "Please check your spam or promotions folders if you don't see it.",
      });
    } catch (err: any) {
      console.error("Resend error:", err);
      setErrorMessage(err.message || "Failed to resend code.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Social Signup Redirects
  const handleOAuthSignUp = async (strategy: "oauth_google" | "oauth_github") => {
    if (!isLoaded) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await signUp.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/onboarding",
      });
    } catch (err: any) {
      console.error("OAuth error:", err);
      const msg = err.message || "Failed to initialize social sign up.";
      setErrorMessage(msg);
      toast.error("OAuth Redirect Failed", { description: msg });
      setIsLoading(false);
    }
  };

  if (verifying) {
    return (
      <AuthCard>
        <AuthHeader
          title="Verify your email"
          description={`Please check your inbox. We've sent a code to ${signUpForm.getValues("email")}.`}
          icon={<KeyRound className="h-7 w-7 text-purple-400" />}
        />

        {errorMessage && <AuthError message={errorMessage} />}
        {successMessage && <AuthSuccess message={successMessage} />}

        <form onSubmit={verifyForm.handleSubmit(onVerifySubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              6-Digit Verification Code
            </label>
            <Input
              type="text"
              placeholder="123456"
              maxLength={6}
              className="text-center tracking-[0.5em] text-lg font-bold bg-zinc-900/50 border-zinc-800 text-white placeholder-zinc-700 focus-visible:ring-purple-500 h-12"
              disabled={isLoading}
              {...verifyForm.register("code")}
            />
            {verifyForm.formState.errors.code && (
              <p className="text-xs font-semibold text-red-400 mt-1">
                {verifyForm.formState.errors.code.message}
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
              "Verify and Continue"
            )}
          </Button>

          <div className="flex justify-between items-center text-xs font-semibold pt-1">
            <button
              type="button"
              onClick={() => setVerifying(false)}
              className="text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" /> Back
            </button>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isLoading}
              className="text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
            >
              Resend code
            </button>
          </div>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <AuthHeader
        title="Create your account"
        description="Join Mindrift and unlock your full cognitive capability."
        icon={<Brain className="h-7 w-7 text-purple-400" />}
      />

      {errorMessage && <AuthError message={errorMessage} />}

      <form onSubmit={signUpForm.handleSubmit(onSignUpSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
            <Input
              type="text"
              placeholder="Arthur Dent"
              className="pl-11 bg-zinc-900/50 border-zinc-800 text-white placeholder-zinc-500 focus-visible:ring-purple-500 h-11"
              disabled={isLoading}
              {...signUpForm.register("fullName")}
            />
          </div>
          {signUpForm.formState.errors.fullName && (
            <p className="text-xs font-semibold text-red-400 mt-1">
              {signUpForm.formState.errors.fullName.message}
            </p>
          )}
        </div>

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
              {...signUpForm.register("email")}
            />
          </div>
          {signUpForm.formState.errors.email && (
            <p className="text-xs font-semibold text-red-400 mt-1">
              {signUpForm.formState.errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
            <Input
              type="password"
              placeholder="••••••••"
              className="pl-11 bg-zinc-900/50 border-zinc-800 text-white placeholder-zinc-500 focus-visible:ring-purple-500 h-11"
              disabled={isLoading}
              {...signUpForm.register("password")}
            />
          </div>
          {signUpForm.formState.errors.password && (
            <p className="text-xs font-semibold text-red-400 mt-1">
              {signUpForm.formState.errors.password.message}
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
              Creating Account...
            </span>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>

      <AuthDivider />

      <SocialLoginButtons
        onGoogleClick={() => handleOAuthSignUp("oauth_google")}
        onGithubClick={() => handleOAuthSignUp("oauth_github")}
        isLoading={isLoading}
      />

      <AuthFooter
        message="Already have an account?"
        actionText="Sign In"
        actionHref="/sign-in"
      />
    </AuthCard>
  );
}
