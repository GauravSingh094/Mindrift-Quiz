"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, User, Check, Sparkles, ChevronRight, ChevronLeft, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useUserStore } from "@/stores/user-store";
import { apiClient } from "@/lib/api-client";
import { UserProfile } from "@/types";

const interestsList = [
  "Frontend",
  "Backend",
  "Java",
  "Python",
  "Flutter",
  "AI",
  "System Design",
  "DevOps",
  "Cybersecurity",
  "Database Systems",
];

const skillLevels = [
  {
    tier: "BEGINNER",
    label: "Beginner",
    description: "New to tech or exploring new domains. Eager to learn the basics.",
    color: "border-cyan-500/30 text-cyan-400 bg-cyan-950/10 hover:border-cyan-400",
    glow: "shadow-cyan-500/10",
  },
  {
    tier: "INTERMEDIATE",
    label: "Intermediate",
    description: "Possess strong foundations. Ready for advanced systems and logic challenges.",
    color: "border-purple-500/30 text-purple-400 bg-purple-950/10 hover:border-purple-400",
    glow: "shadow-purple-500/10",
  },
  {
    tier: "ADVANCED",
    label: "Advanced",
    description: "Experienced builder. Seeking architectural challenges and deep system design.",
    color: "border-pink-500/30 text-pink-400 bg-pink-950/10 hover:border-pink-400",
    glow: "shadow-pink-500/10",
  },
  {
    tier: "EXPERT",
    label: "Expert",
    description: "Authority in development. Crushing microservices, algorithms, and AI scaling.",
    color: "border-emerald-500/30 text-emerald-400 bg-emerald-950/10 hover:border-emerald-400",
    glow: "shadow-emerald-500/10",
  },
];

export function OnboardingFlow() {
  const { user, isLoaded: userLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const setProfile = useUserStore((state) => state.setProfile);

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<string>("BEGINNER");

  // Populate name from Clerk user once loaded
  useEffect(() => {
    if (userLoaded && user) {
      setFullName(user.fullName || "");
      if (user.username) {
        setUsername(user.username);
      } else if (user.primaryEmailAddress) {
        // Fallback username prefix from email
        const prefix = user.primaryEmailAddress.emailAddress.split("@")[0];
        setUsername(prefix.replace(/[^a-zA-Z0-9_]/g, ""));
      }
    }
  }, [userLoaded, user]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((item) => item !== interest)
        : [...prev, interest]
    );
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!fullName.trim()) {
        toast.error("Name Required", { description: "Please enter your full name." });
        return;
      }
      if (!username.trim() || username.length < 3) {
        toast.error("Username Invalid", { description: "Username must be at least 3 characters." });
        return;
      }
    }
    if (step === 2 && selectedInterests.length === 0) {
      toast.error("Selection Required", { description: "Please choose at least one learning interest." });
      return;
    }
    setStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setStep((prev) => prev - 1);
  };

  // Onboarding completion: Submit sync to backend & save status
  const handleOnboardingComplete = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Unable to obtain authorization token.");
      }

      // Sync backend user with actual onboarding details
      // Sending onboarding parameters alongside custom username
      const response = await apiClient<UserProfile>("/users/sync", {
        method: "POST",
        token,
        body: JSON.stringify({
          fullName,
          username: username.toLowerCase().trim(),
          interests: selectedInterests,
          skillLevel: selectedSkill,
          onboarded: true,
        }),
      });

      // Update Zustand local storage user profiles
      setProfile(response);

      // Save onboarding flag to localStorage for instant middleware checks
      localStorage.setItem(`mindrift_onboarded_${user?.id || "global"}`, "true");

      toast.success("Profile Activated!", {
        description: "Onboarding complete. Let's start challenging!",
      });

      router.push("/dashboard");
    } catch (err: any) {
      console.warn("Onboarding backend sync failed. Proceeding with local configuration:", err);
      
      const fallbackOnboardProfile: UserProfile = {
        id: `usr_fallback_${user?.id}`,
        clerkId: user?.id || "",
        username: username.toLowerCase().trim(),
        email: user?.primaryEmailAddress?.emailAddress || "learner@mindrift.app",
        roles: ["ROLE_USER"],
        permissions: ["quizzes:read", "quizzes:create"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setProfile(fallbackOnboardProfile);
      localStorage.setItem(`mindrift_onboarded_${user?.id || "global"}`, "true");

      toast.warning("Profile Activated (Offline Mode)", {
        description: "Your local profile setup has been cached. Welcome to Mindrift!",
      });

      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-zinc-950/60 border border-zinc-800/80 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] shadow-purple-500/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5 pointer-events-none" />

      {/* Onboarding Header */}
      <div className="text-center space-y-2 relative z-10 mb-8">
        <div className="flex justify-center mb-2">
          <div className="bg-purple-500/10 border border-purple-500/25 p-3 rounded-2xl text-purple-400">
            <Brain className="h-7 w-7 animate-pulse" />
          </div>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center justify-center gap-1.5">
          <span>Set up your profile</span>
          <Sparkles className="h-4.5 w-4.5 text-purple-400" />
        </h1>
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
          Step {step} of 3 &bull; {step === 1 ? "Profile" : step === 2 ? "Interests" : "Skill tier"}
        </p>

        {/* Step Progress indicators */}
        <div className="flex gap-2 max-w-[120px] mx-auto mt-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
                s <= step ? "bg-purple-500" : "bg-zinc-800"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step Panels */}
      <div className="relative z-10 min-h-[220px]">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                  <Input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="E.g., Arthur Dent"
                    className="pl-11 bg-zinc-900/50 border-zinc-800 text-white focus-visible:ring-purple-500 h-11"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Choose Username
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-sm font-semibold text-zinc-600">@</span>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                    placeholder="username"
                    className="pl-8 bg-zinc-900/50 border-zinc-800 text-white focus-visible:ring-purple-500 h-11"
                  />
                </div>
                <p className="text-[10px] text-zinc-500 font-medium">
                  Only alphanumeric characters and underscores are allowed.
                </p>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              <p className="text-sm text-zinc-400 font-semibold text-center mb-3">
                Select your preferred learning and competition topics.
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-h-[220px] overflow-y-auto pr-1">
                {interestsList.map((interest) => {
                  const active = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      type="button"
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all duration-300 flex items-center gap-1.5 select-none ${
                        active
                          ? "bg-purple-500/10 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                          : "bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
                      }`}
                    >
                      {active && <Check className="h-3 w-3 stroke-[3px]" />}
                      <span>{interest}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              <p className="text-sm text-zinc-400 font-semibold text-center mb-2">
                What is your engineering/learning competence tier?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {skillLevels.map((lvl) => {
                  const active = selectedSkill === lvl.tier;
                  return (
                    <button
                      key={lvl.tier}
                      onClick={() => setSelectedSkill(lvl.tier)}
                      type="button"
                      className={`text-left p-3.5 rounded-xl border transition-all duration-300 flex flex-col justify-between h-[105px] shadow-sm ${lvl.color} ${
                        active
                          ? `${lvl.glow} ring-1 ring-purple-500/20 border-opacity-100 bg-opacity-40`
                          : "opacity-60 hover:opacity-90"
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-xs font-extrabold tracking-wider uppercase">
                          {lvl.label}
                        </span>
                        {active && (
                          <div className="bg-purple-500/20 border border-purple-500/40 rounded-full p-0.5">
                            <Check className="h-3.5 w-3.5 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-normal mt-1 font-medium">
                        {lvl.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Steps Navigation Controls */}
      <div className="flex items-center justify-between mt-8 pt-4 border-t border-zinc-900 relative z-10">
        {step > 1 ? (
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevStep}
            disabled={isLoading}
            className="border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:bg-zinc-900 hover:text-white h-10 gap-1 rounded-xl"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
        ) : (
          <div />
        )}

        {step < 3 ? (
          <Button
            type="button"
            onClick={handleNextStep}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold h-10 gap-1 rounded-xl shadow-lg shadow-purple-500/5 px-5 ml-auto"
          >
            <span>Continue</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleOnboardingComplete}
            disabled={isLoading}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold h-10 gap-2 rounded-xl shadow-lg shadow-purple-500/10 px-6 ml-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Activating Profile...</span>
              </>
            ) : (
              <>
                <span>Complete Onboarding</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
