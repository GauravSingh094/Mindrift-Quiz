"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getCompetitionAnalytics } from "@/features/analytics/api";
import { CompetitionAnalyticsData } from "@/features/analytics/types";
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
  TrendingUp,
  Bookmark,
  Sparkles,
  Terminal,
  Clock,
  History,
  HelpCircle,
  Loader2,
  Sword,
  Target
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  Cell
} from "recharts";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Link from "next/link";

export default function CompetitionAnalyticsPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [data, setData] = useState<CompetitionAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const res = await getCompetitionAnalytics();
        setData(res);
      } catch (err) {
        toast.error("Failed to load competition analytics.");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const navLinks = [
    { href: "/analytics", label: "Overview" },
    { href: "/analytics/quizzes", label: "Quizzes" },
    { href: "/analytics/competitions", label: "Competitions" },
    { href: "/analytics/skills", label: "Skills Matrix" },
    { href: "/analytics/timeline", label: "Journey Timeline" }
  ];

  if (isLoading || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <p className="text-sm text-zinc-500 font-semibold tracking-wide animate-pulse">
          Retrieving match analytics...
        </p>
      </div>
    );
  }

  const winRatio = Math.round((data.wins / data.participations) * 100);

  const winLossData = [
    { name: "Matches", wins: data.wins, losses: data.losses }
  ];

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
            Competition Match Analytics
          </h1>
          <p className="text-xs text-zinc-500 font-semibold mt-1">
            Track proctored global standings timelines, arena win/loss distributions, and match accuracies.
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

      {/* Overview Stat blocks */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Card className="border-zinc-900 bg-zinc-950/40 p-5 space-y-2 relative overflow-hidden">
          <div className="absolute top-3 right-3 text-cyan-500/10">
            <Sword className="h-10 w-10" />
          </div>
          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Participations</p>
          <p className="text-3xl font-black text-white">{data.participations}</p>
          <p className="text-[9px] text-zinc-500 font-extrabold uppercase">Matches Lock-in</p>
        </Card>

        <Card className="border-zinc-900 bg-zinc-950/40 p-5 space-y-2 relative overflow-hidden">
          <div className="absolute top-3 right-3 text-cyan-500/10">
            <Trophy className="h-10 w-10" />
          </div>
          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Wins / podiums</p>
          <p className="text-3xl font-black text-white">{data.wins}</p>
          <p className="text-[9px] text-cyan-400 font-extrabold uppercase">{winRatio}% Win ratio</p>
        </Card>

        <Card className="border-zinc-900 bg-zinc-950/40 p-5 space-y-2 relative overflow-hidden">
          <div className="absolute top-3 right-3 text-purple-500/10">
            <Target className="h-10 w-10" />
          </div>
          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Arena Accuracy</p>
          <p className="text-3xl font-black text-white">{data.accuracy}%</p>
          <p className="text-[9px] text-purple-400 font-extrabold uppercase">Average accuracy rate</p>
        </Card>

        <Card className="border-zinc-900 bg-zinc-950/40 p-5 space-y-2 relative overflow-hidden">
          <div className="absolute top-3 right-3 text-purple-500/10">
            <TrendingUp className="h-10 w-10" />
          </div>
          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Rank standing</p>
          <p className="text-3xl font-black text-white">#2</p>
          <p className="text-[9px] text-zinc-550 font-bold uppercase">Top 2% Globally</p>
        </Card>
      </div>

      {/* Recharts dynamic panels */}
      {mounted && (
        <div className="grid gap-6 md:grid-cols-3">
          
          {/* Rank standing timeline (2/3 width) */}
          <Card className="border-zinc-900 bg-zinc-950/20 backdrop-blur-xl md:col-span-2 overflow-hidden min-h-[300px] flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-zinc-900/50 bg-zinc-950/20">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 pl-0.5">
                <TrendingUp className="h-4.5 w-4.5 text-purple-400" />
                <span>Global Rank Position timeline</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 flex-1 flex items-center justify-center">
              <div className="w-full h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.rankHistory} margin={{ left: -25, right: 10, top: 10, bottom: 0 }}>
                    <XAxis dataKey="date" stroke="#52525b" style={{ fontSize: "10px", fontWeight: "bold" }} />
                    <YAxis reversed stroke="#52525b" style={{ fontSize: "10px", fontWeight: "bold" }} />
                    <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#18181b", fontSize: "11px", fontWeight: "bold" }} />
                    <Line type="monotone" dataKey="rank" stroke="#06b6d4" strokeWidth={3} dot={{ fill: "#06b6d4", strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Win/Loss histograms (1/3 width) */}
          <Card className="border-zinc-900 bg-zinc-950/20 backdrop-blur-xl overflow-hidden min-h-[300px] flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-zinc-900/50 bg-zinc-950/20">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 pl-0.5">
                <Sword className="h-4.5 w-4.5 text-purple-400" />
                <span>Win vs Loss Diagnostics</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 flex-1 flex items-center justify-center">
              <div className="w-full h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={winLossData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#52525b" style={{ fontSize: "10px", fontWeight: "bold" }} />
                    <YAxis stroke="#52525b" style={{ fontSize: "10px", fontWeight: "bold" }} />
                    <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#18181b", fontSize: "11px", fontWeight: "bold" }} />
                    <Legend wrapperStyle={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase" }} />
                    <Bar dataKey="wins" name="Wins" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="losses" name="Losses" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}
