import { VerifyEmailForm } from "@/components/auth/verify-email-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Email | Mindrift",
  description: "Complete your email verification code to activate your Mindrift account.",
};

export default function VerifyEmailPage() {
  return (
    <div className="w-full flex justify-center py-6">
      <VerifyEmailForm />
    </div>
  );
}
