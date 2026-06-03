import { OnboardingFlow } from "@/components/auth/onboarding-flow";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Onboarding | Mindrift",
  description: "Configure your interests and activate your Mindrift competitive learning profile.",
};

export default function OnboardingPage() {
  return (
    <div className="w-full flex justify-center py-6">
      <OnboardingFlow />
    </div>
  );
}
