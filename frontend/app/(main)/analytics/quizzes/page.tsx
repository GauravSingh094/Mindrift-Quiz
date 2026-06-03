"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getQuizAnalytics } from "@/features/analytics/api";
import { QuizAnalyticsData } from "@/features/analytics/types";
import { useAnalyticsStore } from "@/features/analytics/store/analytics-store";
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
  Loader2
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Link from "next/link";

export default function QuizAnalyticsPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [data, setData] = useState<QuizAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const res = await getQuizAnalytics();
        setData(res);
      } catch (err) {
        toast.error("Failed to load quiz analytics.");
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

  const pieColors = ["#a855f7", "#06b6d4", "#ec4899", "#18181b"];

  if (isLoading || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <p className="text-sm text-zinc-500 font-semibold tracking-wide animate-pulse">
          Indexing quiz charts...
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
            Quiz Performance Analytics
          </h1>
          <p className="text-xs text-zinc-500 font-semibold mt-1">
            Examine quiz histories, accuracy trends, category distributions, and multi-host grading velocities.
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

      {/* Advanced Chart System panel (Task 9) */}
      {mounted && (
        <div className="grid gap-6 md:grid-cols-3">
          
          {/* Accuracy trend Area (2/3 width) */}
          <Card className="border-zinc-900 bg-zinc-950/20 backdrop-blur-xl md:col-span-2 overflow-hidden min-h-[300px] flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-zinc-900/50 bg-zinc-950/20">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 pl-0.5">
                <TrendingUp className="h-4.5 w-4.5 text-purple-400" />
                <span>Accuracy progression trend</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 flex-1 flex items-center justify-center">
              <div className="w-full h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.accuracyTrend} margin={{ left: -25, right: 10, top: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#52525b" style={{ fontSize: "10px", fontWeight: "bold" }} />
                    <YAxis domain={[0, 100]} stroke="#52525b" style={{ fontSize: "10px", fontWeight: "bold" }} />
                    <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#18181b", fontSize: "11px", fontWeight: "bold" }} />
                    <Area type="monotone" dataKey="value" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#purpleGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Category breakdown pie (1/3 width) */}
          <Card className="border-zinc-900 bg-zinc-950/20 backdrop-blur-xl overflow-hidden min-h-[300px] flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-zinc-900/50 bg-zinc-950/20">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 pl-0.5">
                <Layers className="h-4.5 w-4.5 text-cyan-400" />
                <span>Focal Category Distribution</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 flex-1 flex flex-col items-center justify-center">
              <div className="w-full h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.categoryBreakdown} innerRadius={42} outerRadius={65} paddingAngle={4} dataKey="count" nameKey="category">
                      {data.categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#18181b", fontSize: "11px", fontWeight: "bold" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-3 text-[8px] font-bold text-zinc-500 uppercase mt-4">
                {data.categoryBreakdown.map((entry, index) => (
                  <span key={entry.category} className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: pieColors[index % pieColors.length] }} />
                    {entry.category}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Time Analysis spent bar chart (Full width bottom grid) */}
          <Card className="border-zinc-900 bg-zinc-950/20 backdrop-blur-xl md:col-span-3 overflow-hidden min-h-[300px] flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-zinc-900/50 bg-zinc-950/20">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 pl-0.5">
                <Clock className="h-4.5 w-4.5 text-cyan-400" />
                <span>Speed Distribution vs Global Average (Seconds)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 flex-1 flex items-center justify-center">
              <div className="w-full h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.timeAnalysis} margin={{ left: -25, right: 10, top: 10, bottom: 0 }}>
                    <XAxis dataKey="quiz" stroke="#52525b" style={{ fontSize: "10px", fontWeight: "bold" }} />
                    <YAxis stroke="#52525b" style={{ fontSize: "10px", fontWeight: "bold" }} />
                    <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#18181b", fontSize: "11px", fontWeight: "bold" }} />
                    <Legend wrapperStyle={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase" }} />
                    <Bar dataKey="you" name="Arthur Dent (You)" fill="#a855f7" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="average" name="Global Average Speed" fill="#18181b" stroke="#27272a" strokeWidth={1} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 6. Graded Quiz history logs table */}
      <div className="space-y-4">
        <h2 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 pl-0.5">
          <History className="h-4 w-4 text-purple-400" />
          <span>Graded Quiz History</span>
        </h2>

        <Card className="border-zinc-900 bg-zinc-950/40 backdrop-blur-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs font-bold text-zinc-400">
              <thead>
                <tr className="border-b border-zinc-900 text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 bg-zinc-950/40">
                  <th className="px-6 py-4.5">Quiz Subject</th>
                  <th className="px-6 py-4.5 text-right">XP Points</th>
                  <th className="px-6 py-4.5 text-center">Accuracy</th>
                  <th className="px-6 py-4.5 text-right">Completion Date</th>
                </tr>
              </thead>
              <tbody>
                {data.quizHistory.map((item) => (
                  <tr key={item.id} className="border-b border-zinc-900/60 hover:bg-zinc-900/10 transition-all">
                    <td className="px-6 py-4.5 text-zinc-200">
                      {item.title}
                    </td>
                    <td className="px-6 py-4.5 text-right font-black font-mono tracking-wide text-cyan-400">
                      {item.score} XP
                    </td>
                    <td className="px-6 py-4.5 text-center font-mono">
                      {item.accuracy}%
                    </td>
                    <td className="px-6 py-4.5 text-right font-mono text-zinc-500">
                      {new Date(item.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

    </div>
  );
}
