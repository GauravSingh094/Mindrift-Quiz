"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSkillGapProfile } from "@/features/ai/api";
import { SkillGapProfile } from "@/features/ai/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Brain,
  Cpu,
  Zap,
  Layers,
  ArrowRight,
  Sparkles,
  Bookmark,
  CheckCircle,
  HelpCircle,
  Loader2,
  TrendingUp,
  Award,
  ChevronRight,
  Flame,
  Frown,
  ExternalLink
} from "lucide-react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip
} from "recharts";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function AISkillAnalysisPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<SkillGapProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      try {
        const data = await getSkillGapProfile();
        setProfile(data);
      } catch (err) {
        toast.error("Failed to load skill analysis.");
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <p className="text-sm text-zinc-500 font-semibold tracking-wide animate-pulse">
          Compiling diagnostics charts...
        </p>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto max-w-5xl space-y-8 relative z-10">
      
      {/* Back button */}
      <Button 
        onClick={() => router.push("/ai")}
        variant="ghost" 
        className="text-zinc-500 hover:text-zinc-300 text-xs font-extrabold uppercase tracking-wider p-0 bg-transparent hover:bg-transparent"
      >
        ← Back to Hub
      </Button>

      {/* Page Header */}
      <div className="border-b border-zinc-900 pb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4.5 w-4.5 text-purple-400" />
          <span className="text-[10px] font-extrabold uppercase text-purple-400 tracking-wider">
            Diagnostic Telemetry Lounge
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent mt-1.5 font-mono">
          Skill Gap Analysis
        </h1>
        <p className="text-xs text-zinc-500 font-semibold mt-1">
          Examine multi-dimension engineering skill points, strengths gaps, and tailored proctored recommendations resources.
        </p>
      </div>

      {/* Grid: Left Column (Radar Chart & Resources), Right Column (Strengths/Weaknesses cards) */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Left Column (2/3 width): Radar chart and suggested learning resources */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Recharts Radar chart diagnostics */}
          {mounted && profile.scores && (
            <Card className="border-zinc-900 bg-zinc-950/20 backdrop-blur-xl overflow-hidden min-h-[350px] flex flex-col justify-between">
              <CardHeader className="pb-3 border-b border-zinc-900/50 bg-zinc-950/20">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 pl-0.5">
                  <Sparkles className="h-4.5 w-4.5 text-purple-400" />
                  <span>Cognitive Skill Distribution Map</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 flex-1 flex items-center justify-center">
                <div className="w-full h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={profile.scores}>
                      <PolarGrid stroke="#27272a" />
                      <PolarAngleAxis dataKey="subject" stroke="#71717a" style={{ fontSize: "10px", fontWeight: "bold" }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#27272a" style={{ fontSize: "9px" }} />
                      <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#18181b", fontSize: "11px", fontWeight: "bold" }} />
                      <Legend wrapperStyle={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase" }} />
                      <Radar name="Arthur Dent (You)" dataKey="score" stroke="#a855f7" fill="#a855f7" fillOpacity={0.3} />
                      <Radar name="Global Average Score" dataKey="average" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.1} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Suggested Resources lists */}
          <div className="space-y-3.5">
            <h2 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest pl-0.5">Suggested Learning Resources</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {profile.resources.map((res) => (
                <div
                  key={res.name}
                  className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-2xl flex flex-col justify-between gap-3 group hover:border-zinc-800 transition-all min-h-[120px]"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-black text-white group-hover:text-purple-400 transition-colors">
                      {res.name}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-semibold leading-relaxed">
                      {res.reason}
                    </p>
                  </div>
                  <a
                    href={res.url}
                    onClick={(e) => {
                      e.preventDefault();
                      toast.info(`Launching learning portal for: ${res.name}`);
                    }}
                    className="text-[10px] text-cyan-400 font-extrabold hover:underline uppercase tracking-wider flex items-center gap-1 leading-none"
                  >
                    <span>Inspect Course</span> <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1/3 width): Strengths & Weaknesses checklists */}
        <div className="space-y-6">
          
          {/* Strengths card list */}
          <Card className="border-zinc-900 bg-zinc-950/40 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/2 via-transparent to-transparent pointer-events-none" />
            <CardHeader className="pb-3 border-b border-zinc-900/50">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 pl-0.5">
                <Flame className="h-4.5 w-4.5 text-cyan-400 animate-pulse" />
                <span>Peak Strengths</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="py-4 space-y-3.5 text-xs font-bold text-zinc-300">
              {profile.strengths.map((str) => (
                <div key={str} className="flex gap-2.5 items-center">
                  <CheckCircle className="h-4.5 w-4.5 text-cyan-400 shrink-0" />
                  <span>{str}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Weaknesses card */}
          <Card className="border-zinc-900 bg-zinc-950/40 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/2 via-transparent to-transparent pointer-events-none" />
            <CardHeader className="pb-3 border-b border-zinc-900/50">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 pl-0.5">
                <Frown className="h-4.5 w-4.5 text-purple-400 animate-pulse" />
                <span>Target Skill Gaps</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="py-4 space-y-3.5 text-xs font-bold text-zinc-400">
              {profile.weaknesses.map((weak) => (
                <div key={weak} className="flex gap-2.5 items-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0" />
                  <span>{weak}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
}
