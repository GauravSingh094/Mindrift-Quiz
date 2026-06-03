"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getSkillAnalytics } from "@/features/analytics/api";
import { SkillAnalyticsData } from "@/features/analytics/types";
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
  Frown
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
import Link from "next/link";

export default function SkillAnalyticsPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [profile, setProfile] = useState<SkillAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      try {
        const data = await getSkillAnalytics();
        setProfile(data);
      } catch (err) {
        toast.error("Failed to load skill matrix.");
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  const navLinks = [
    { href: "/analytics", label: "Overview" },
    { href: "/analytics/quizzes", label: "Quizzes" },
    { href: "/analytics/competitions", label: "Competitions" },
    { href: "/analytics/skills", label: "Skills Matrix" },
    { href: "/analytics/timeline", label: "Journey Timeline" }
  ];

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <p className="text-sm text-zinc-500 font-semibold tracking-wide animate-pulse">
          Indexing skill matrices...
        </p>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto max-w-5xl space-y-8 relative z-10">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-900 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="h-4.5 w-4.5 text-purple-400" />
            <span className="text-[10px] font-extrabold uppercase text-purple-400 tracking-wider">
              Growth Intelligence Console
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent mt-1.5 font-mono">
            Cognitive Skill Matrix
          </h1>
          <p className="text-xs text-zinc-500 font-semibold mt-1">
            Analyze multi-dimension engineering skill points distributions, strengths peaks, and forecasted weaknesses target gaps.
          </p>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-900/60 pb-4">
        {navLinks.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`text-[10px] font-extrabold px-4 py-2.5 rounded-xl transition-all border uppercase tracking-wider ${
                active
                  ? "bg-purple-500/10 border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                  : "bg-zinc-950/40 border-zinc-900 text-zinc-500 hover:border-zinc-800 hover:text-zinc-300"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* Grid: Left Column (Radar Chart), Right Column (Strengths/Weaknesses cards) */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Left Column (2/3 width): Radar chart diagnostics */}
        <div className="md:col-span-2 space-y-6">
          {mounted && profile.skills && (
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
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={profile.skills}>
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
