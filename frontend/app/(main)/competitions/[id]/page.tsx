"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCompetitionById, registerForCompetition } from "@/features/competition/api";
import { Quiz } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Calendar,
  Users,
  Clock,
  ArrowRight,
  Shield,
  Share2,
  Lock,
  UserCheck,
  CheckCircle2,
  Sparkles,
  Loader2,
  VolumeX,
  ExternalLink
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function CompetitionDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const [competition, setCompetition] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [agreedToRules, setAgreedToRules] = useState(false);

  useEffect(() => {
    async function loadDetails() {
      setIsLoading(true);
      try {
        const data = await getCompetitionById(id as string);
        setCompetition(data);
        // Pre-simulate registration check (if user_demo is registered)
        if (id === "competition-1") {
          setIsRegistered(true);
        }
      } catch (err) {
        toast.error("Failed to load competition details.");
      } finally {
        setIsLoading(false);
      }
    }
    if (id) loadDetails();
  }, [id]);

  const handleRegister = async () => {
    if (!agreedToRules) {
      toast.warning("Please review and agree to the rules before registering.");
      return;
    }
    setIsRegistering(true);
    try {
      const res = await registerForCompetition(id as string);
      if (res.success) {
        setIsRegistered(true);
        toast.success("Successfully registered for the Arena Tournament!");
      } else {
        toast.error("Failed to register. Capacity might be full.");
      }
    } catch (err) {
      toast.error("An error occurred during registration.");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleShare = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    navigator.clipboard.writeText(url);
    toast.success("Tournament link copied to clipboard!");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <p className="text-sm text-zinc-500 font-semibold tracking-wide animate-pulse">
          Opening proctored details portal...
        </p>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-center px-4">
        <Trophy className="h-12 w-12 text-zinc-700 mb-4" />
        <h1 className="text-xl font-bold text-white mb-1">Arena Not Found</h1>
        <p className="text-sm text-zinc-500 max-w-xs font-semibold mb-5">
          This competition ID might be inactive or has already ended.
        </p>
        <Button onClick={() => router.push("/competitions")} className="bg-zinc-900 border border-zinc-800 text-zinc-300">
          Back to Listings
        </Button>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto max-w-5xl space-y-8 relative z-10">
      
      {/* Back link */}
      <Button 
        onClick={() => router.push("/competitions")}
        variant="ghost" 
        className="text-zinc-500 hover:text-zinc-300 text-xs font-extrabold uppercase tracking-wider p-0 bg-transparent hover:bg-transparent"
      >
        ← Back to Listings
      </Button>

      {/* Main Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Left Column: Information (2/3) */}
        <div className="md:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1 font-bold uppercase tracking-wider text-[9px] rounded-full">
                {competition.category || "General"}
              </Badge>
              <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3 py-1 font-bold uppercase tracking-wider text-[9px] rounded-full">
                Difficulty: {competition.difficulty}
              </Badge>
              <Badge className="bg-zinc-950 text-zinc-400 border border-zinc-800 px-3 py-1 font-bold uppercase tracking-wider text-[9px] rounded-full">
                Live Proctor Active
              </Badge>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              {competition.title}
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed font-semibold">
              {competition.description}
            </p>
          </motion.div>

          {/* Rules Accordion / Cards */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="space-y-4"
          >
            <h2 className="text-lg font-bold text-white tracking-wide border-b border-zinc-900 pb-2">
              Official Tournament Rules
            </h2>
            <div className="grid gap-3.5">
              <div className="flex gap-3 p-4 bg-zinc-950/40 border border-zinc-900 rounded-xl">
                <Shield className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-white">Tab Switch Protection Lock</p>
                  <p className="text-[11px] text-zinc-500 font-semibold leading-relaxed">
                    Leaving the browser tab, exiting full screen, or focusing on external apps registers immediate flags on the live proctor system.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 p-4 bg-zinc-950/40 border border-zinc-900 rounded-xl">
                <Lock className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-white">Action Interceptors Active</p>
                  <p className="text-[11px] text-zinc-500 font-semibold leading-relaxed">
                    Clipboard actions (Copy, Cut, Paste) are globally intercepted and prohibited within the exam window.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 p-4 bg-zinc-950/40 border border-zinc-900 rounded-xl">
                <VolumeX className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-white">Auto-Submit Countdown</p>
                  <p className="text-[11px] text-zinc-500 font-semibold leading-relaxed">
                    Once the clock ticks down, answers are auto-locked and sent to the grading cluster. Make sure to track the time.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Rules Checkbox */}
          {!isRegistered && (
            <div className="flex items-center gap-3 p-4 bg-purple-950/5 border border-purple-500/10 rounded-xl">
              <input
                id="rules-check"
                type="checkbox"
                checked={agreedToRules}
                onChange={(e) => setAgreedToRules(e.target.checked)}
                className="h-4.5 w-4.5 rounded border-zinc-800 text-purple-500 focus:ring-purple-500 accent-purple-500 cursor-pointer"
              />
              <label htmlFor="rules-check" className="text-xs text-zinc-400 font-bold select-none cursor-pointer">
                I agree to the proctor terms, academic integrity requirements, and rules of this Arena.
              </label>
            </div>
          )}
        </div>

        {/* Right Column: Cards (1/3) */}
        <div className="space-y-6">
          
          {/* Action Box Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-zinc-900 bg-zinc-950/40 backdrop-blur-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-purple-500/2 via-transparent to-transparent pointer-events-none" />
              
              <CardHeader className="space-y-2 pb-4">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                  Registration Desk
                </CardTitle>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-black text-white">5,000 XP</p>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase">Grand Prize</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pb-4 border-t border-zinc-900/50 pt-4">
                {/* Specs list */}
                <div className="space-y-3.5 text-xs font-bold text-zinc-400">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 uppercase tracking-wider text-[10px] pl-0.5">Duration</span>
                    <span className="text-white">30 Minutes</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 uppercase tracking-wider text-[10px] pl-0.5">Capacity</span>
                    <span className="text-white">42 / 100 max</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 uppercase tracking-wider text-[10px] pl-0.5">Start Time</span>
                    <span className="text-white">Live / Ongoing</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 uppercase tracking-wider text-[10px] pl-0.5">Organizer</span>
                    <span className="text-white flex items-center gap-1">
                      Mindrift Academy <Sparkles className="h-3 w-3 text-cyan-400" />
                    </span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-2.5 pt-2 border-t border-zinc-900/50">
                {isRegistered ? (
                  <Button
                    onClick={() => router.push(`/competitions/${id}/lobby`)}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white font-extrabold h-11 rounded-xl gap-2 text-xs transition-all shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                  >
                    <span>Enter Live Lobby</span>
                    <ArrowRight className="h-3.5 w-3.5 animate-pulse" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleRegister}
                    disabled={isRegistering}
                    className="w-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 hover:text-white font-extrabold h-11 rounded-xl text-xs transition-all"
                  >
                    {isRegistering ? (
                      <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <UserCheck className="h-4 w-4 text-purple-400" /> Register Now
                      </span>
                    )}
                  </Button>
                )}
                
                <Button
                  onClick={handleShare}
                  variant="ghost"
                  className="w-full border border-zinc-900 bg-zinc-950/20 text-zinc-500 hover:text-zinc-300 font-bold h-10 rounded-xl gap-1.5 text-[10px] uppercase tracking-wider"
                >
                  <Share2 className="h-3.5 w-3.5" /> Share Tournament
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          {/* Quick instructions box */}
          <div className="p-4 bg-zinc-950/30 border border-zinc-900/50 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider pl-0.5">
              <CheckCircle2 className="h-4 w-4 text-cyan-400" />
              <span>Ready Checklist</span>
            </div>
            <ul className="space-y-1.5 text-[11px] text-zinc-500 font-semibold list-disc list-inside pl-1 leading-normal">
              <li>Ensure stable internet latency.</li>
              <li>Toggle off external notifications.</li>
              <li>Grant focus lock permission in popups.</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
