import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password | Mindrift",
  description: "Reset your Mindrift password securely.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="w-full flex justify-center py-6">
      <ForgotPasswordForm />
    </div>
  );
}
