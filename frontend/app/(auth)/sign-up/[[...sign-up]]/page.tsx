import { SignUpForm } from "@/components/auth/sign-up-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | Mindrift",
  description: "Create your free Mindrift learning account.",
  openGraph: {
    title: "Sign Up | Mindrift",
    description: "Unlock your cognitive analytics dashboard and join competitive arenas on Mindrift.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Sign Up | Mindrift",
    description: "Unlock your cognitive analytics dashboard and join competitive arenas on Mindrift.",
  },
};

export default function SignUpPage() {
  return (
    <div className="w-full flex justify-center py-6">
      <SignUpForm />
    </div>
  );
}
