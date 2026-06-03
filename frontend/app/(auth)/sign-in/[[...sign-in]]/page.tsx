import { SignInForm } from "@/components/auth/sign-in-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | Mindrift",
  description: "Sign in to your Mindrift competitive learning account.",
  openGraph: {
    title: "Sign In | Mindrift",
    description: "Access your dashboard and competitive learning portals on Mindrift.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Sign In | Mindrift",
    description: "Access your dashboard and competitive learning portals on Mindrift.",
  },
};

export default function SignInPage() {
  return (
    <div className="w-full flex justify-center py-6">
      <SignInForm />
    </div>
  );
}
