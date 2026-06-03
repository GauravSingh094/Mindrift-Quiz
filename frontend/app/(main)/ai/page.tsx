"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getSkillGapProfile, getAIRecommendations } from "@/features/ai/api";
import { SkillGapProfile, AIRecommendation } from "@/features/ai/types";
import { useAIStore } from "@/features/ai/store/ai-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  Brain,
  Cpu,
  Zap,
  Layers,
  ArrowRight,
  TrendingUp,
  Bookmark,
  Sparkles,
  Terminal,
  Activity,
  History,
  Target,
  BarChart,
  User,
  Loader2,
  CheckCircle,
  HelpCircle
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Link from "next/link";

export default function AIHubHomePage() {
  const router = useRouter();
  const pathname = usePathname();

  const recommendations = useAIStore((s) => s.recommendations);
  const setRecommendations = useAIStore((s) => s.setRecommendations);

  const [profile, setProfile] = useState<SkillGapProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const profileData = await getSkillGapProfile();
        setProfile(profileData);

        const recData = await getAIRecommendations();
        setRecommendations(recData);
      } catch (err) {
        toast.error("Failed to boot AI Hub control deck.");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [setRecommendations]);

  const quickActions = [
    { title: "Quiz Generator", href: "/ai/quiz-generator", desc: "Build proctored topic sandboxes.", icon: <Terminal className="h-5 w-5 text-purple-400" /> },
    { title: "Learning Paths", href: "/ai/learning-paths", desc: "Compile custom roadmap guides.", icon: <Brain className="h-5 w-5 text-cyan-400" /> },
    { title: "Interview Simulator", href: "/ai/interview-simulator", desc: "Practice real-time grading.", icon: <Cpu className="h-5 w-5 text-purple-400" /> },
    { title: "AI Assistant Chat", href: "/ai/assistant", desc: "Conversational mentor assistance.", icon: <Sparkles className="h-5 w-5 text-cyan-400" /> },
    { title: "Skill Gap Analysis", href: "/ai/skill-analysis", desc: "Examine strength/weak metrics.", icon: <BarChart className="h-5 w-5 text-purple-400" /> },
    { title: "AI Activity Logs", href: "/ai/history", desc: "Persistent generation desk.", icon: <History className="h-5 w-5 text-zinc-500" /> }
  ];

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <p className="text-sm text-zinc-500 font-semibold tracking-wide animate-pulse">
          Calibrating neural models...
        </p>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto max-w-5xl space-y-8 relative z-10">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-900 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="h-4.5 w-4.5 text-purple-400 animate-pulse" />
            <span className="text-[10px] font-extrabold uppercase text-purple-400 tracking-wider">
              Neural intelligence center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent mt-1.5 font-mono">
            Mindrift AI Hub
          </h1>
          <p className="text-xs text-zinc-500 font-semibold mt-1">
            Personalized learning paths, dynamic quiz compilers, real-time proctored mock interview runs, and strengths telemetry.
          </p>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 bg-zinc-950/60 border border-zinc-900 px-4 py-2.5 rounded-2xl text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest pl-0.5">
          <Sparkles className="h-4 w-4 text-cyan-400" />
          <span>LLM Cores Operational</span>
        </div>
      </div>

      {/* 2. Flagship Dual Grid Workspace */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Left Columns (2/3 width): Quick actions grid and recommendations */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Quick actions Selector grid */}
          <div className="space-y-3.5">
            <h2 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest pl-0.5">
              AI Command Lounge
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {quickActions.map((action, idx) => (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25, delay: idx * 0.05 }}
                  onClick={() => router.push(action.href)}
                  className="cursor-pointer"
                >
                  <Card className="border-zinc-900 bg-zinc-950/40 relative overflow-hidden group hover:border-purple-500/20 transition-all duration-300 min-h-[110px] flex flex-col justify-between p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1.5">
                        <p className="text-xs font-black text-white group-hover:text-purple-400 transition-colors">
                          {action.title}
                        </p>
                        <p className="text-[10px] text-zinc-500 font-semibold leading-normal">
                          {action.desc}
                        </p>
                      </div>
                      <div className="p-2 bg-zinc-900/50 border border-zinc-900 rounded-xl group-hover:bg-purple-500/10 group-hover:border-purple-500/20 transition-all">
                        {action.icon}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Recommendations Center lists */}
          <div className="space-y-3.5">
            <h2 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest pl-0.5">
              Personalized Recommendations
            </h2>
            <div className="space-y-3">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:border-zinc-800 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[8px] font-bold uppercase rounded-full px-2">
                        {rec.type}
                      </Badge>
                      <p className="text-xs font-black text-white">{rec.title}</p>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-semibold leading-relaxed max-w-xl">
                      {rec.reason}
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push(rec.url)}
                    className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-400 hover:text-white font-extrabold h-9 text-[10px] uppercase rounded-xl gap-1 shrink-0"
                  >
                    <span>Launch</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column (1/3 width): Neural insight stats & strengths metrics */}
        <div className="space-y-6">
          
          {/* Skill gaps analysis synopsis */}
          <Card className="border-zinc-900 bg-zinc-950/40 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/2 via-transparent to-transparent pointer-events-none" />
            
            <CardHeader className="pb-4">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 pl-0.5">
                <Target className="h-4.5 w-4.5 text-purple-400" />
                <span>Diagnostics Synopsis</span>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 pb-6 border-t border-zinc-900/50 pt-4">
              {/* Strengths list */}
              <div className="space-y-2">
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5 block">Strength Peaks</span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.strengths.slice(0, 2).map((str) => (
                    <Badge key={str} className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[8px] font-bold rounded-full">
                      {str}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Weakness gaps */}
              <div className="space-y-2 border-t border-zinc-900/30 pt-3">
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5 block">Target Improvement Areas</span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.weaknesses.slice(0, 2).map((weak) => (
                    <Badge key={weak} className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[8px] font-bold rounded-full">
                      {weak}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI insights Weekly Goals check lists */}
          <div className="p-4 bg-zinc-950/30 border border-zinc-900/60 rounded-2xl space-y-3.5">
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">
              Weekly AI Insights & Goals
            </p>
            <div className="space-y-2.5 text-[11px] text-zinc-400 font-bold">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5 animate-pulse" />
                <span>Optimize Kafka Retention log brokers by Friday.</span>
              </div>
              <div className="flex items-start gap-2 border-t border-zinc-900/30 pt-2.5">
                <CheckCircle className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5 animate-pulse" />
                <span>Complete Swarm Speed Run competition match.</span>
              </div>
              <div className="flex items-start gap-2 border-t border-zinc-900/30 pt-2.5">
                <CheckCircle className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5 animate-pulse" />
                <span>Compile a roadmap learning path on DSA sharding rules.</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
