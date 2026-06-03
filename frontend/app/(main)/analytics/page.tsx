"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getPerformanceSummary, getAIPerformanceInsights, getGoalMetrics, exportAnalyticsReport } from "@/features/analytics/api";
import { PerformanceSummary, AIInsightProfile, GoalMetrics } from "@/features/analytics/types";
import { useAnalyticsStore } from "@/features/analytics/store/analytics-store";
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
  HelpCircle,
  Download,
  Share2,
  Calendar,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Link from "next/link";

export default function AnalyticsDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();

  const store = useAnalyticsStore();

  const [summary, setSummary] = useState<PerformanceSummary | null>(null);
  const [insights, setInsights] = useState<AIInsightProfile | null>(null);
  const [goals, setGoals] = useState<GoalMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const summ = await getPerformanceSummary();
        setSummary(summ);
        store.setPerformanceSummary(summ);

        const ins = await getAIPerformanceInsights();
        setInsights(ins);
        store.setInsights(ins);

        const g = await getGoalMetrics();
        setGoals(g);
        store.setGoals(g);
      } catch (err) {
        toast.error("Failed to load performance metrics.");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleExport = async (format: "pdf" | "csv") => {
    setIsExporting(true);
    try {
      const res = await exportAnalyticsReport(format);
      if (res.success) {
        toast.success(`Analytics report successfully exported as ${format.toUpperCase()}!`);
      }
    } catch (_) {
      toast.error("Failed to compile export report.");
    } finally {
      setIsExporting(false);
    }
  };

  const navLinks = [
    { href: "/analytics", label: "Overview" },
    { href: "/analytics/quizzes", label: "Quizzes" },
    { href: "/analytics/competitions", label: "Competitions" },
    { href: "/analytics/skills", label: "Skills Matrix" },
    { href: "/analytics/timeline", label: "Journey Timeline" }
  ];

  if (isLoading || !summary || !insights || !goals) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <p className="text-sm text-zinc-500 font-semibold tracking-wide animate-pulse">
          Sizing intelligence sheets...
        </p>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto max-w-5xl space-y-8 relative z-10">
      
      {/* 1. Page Header Dashboard Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-900 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4.5 w-4.5 text-purple-400" />
            <span className="text-[10px] font-extrabold uppercase text-purple-400 tracking-wider">
              Growth Intelligence Console
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent mt-1.5 font-mono">
            Performance Analytics
          </h1>
          <p className="text-xs text-zinc-500 font-semibold mt-1">
            Track category accuracy rates, proctored rankings progression timeline, goals completion, and forecasted AI suggestions.
          </p>
        </div>

        {/* Export buttons */}
        <div className="flex flex-wrap gap-2.5">
          <Button
            onClick={() => handleExport("pdf")}
            disabled={isExporting}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white font-extrabold h-10 rounded-xl text-xs gap-1.5 transition-all"
          >
            <Download className="h-3.5 w-3.5" /> PDF Report
          </Button>
          <Button
            onClick={() => handleExport("csv")}
            disabled={isExporting}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white font-extrabold h-10 rounded-xl text-xs gap-1.5 transition-all"
          >
            <Download className="h-3.5 w-3.5" /> CSV Sheet
          </Button>
        </div>
      </div>

      {/* 2. Navigation Tabs Links */}
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

      {/* 3. Date range filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          {["7d", "30d", "90d"].map((range) => {
            const active = store.dateRange === range;
            return (
              <button
                key={range}
                onClick={() => store.setDateRange(range as any)}
                className={`text-[9px] font-extrabold px-3.5 py-2 rounded-xl border uppercase tracking-wider select-none ${
                  active
                    ? "bg-purple-500/10 border-purple-500 text-purple-400"
                    : "bg-zinc-950 border-zinc-900 text-zinc-550 hover:text-zinc-300"
                }`}
              >
                Last {range}
              </button>
            );
          })}
        </div>

        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider pl-0.5">
          Global Rank Stand: <span className="text-white font-black">#{summary.globalRank}</span>
        </div>
      </div>

      {/* 4. Overview KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Card className="border-zinc-900 bg-zinc-950/40 p-5 space-y-2 relative overflow-hidden">
          <div className="absolute top-3 right-3 text-purple-500/10">
            <Trophy className="h-10 w-10" />
          </div>
          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Accuracy coefficient</p>
          <p className="text-3xl font-black text-white">{summary.accuracy}%</p>
          <p className="text-[9px] text-cyan-400 font-extrabold uppercase">94% completion rate</p>
        </Card>

        <Card className="border-zinc-900 bg-zinc-950/40 p-5 space-y-2 relative overflow-hidden">
          <div className="absolute top-3 right-3 text-cyan-500/10">
            <Clock className="h-10 w-10" />
          </div>
          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Accumulated Speed</p>
          <p className="text-3xl font-black text-white">{summary.learningHours} hrs</p>
          <p className="text-[9px] text-zinc-500 font-extrabold uppercase">Last 30 days continuous</p>
        </Card>

        <Card className="border-zinc-900 bg-zinc-950/40 p-5 space-y-2 relative overflow-hidden">
          <div className="absolute top-3 right-3 text-purple-500/10">
            <Zap className="h-10 w-10" />
          </div>
          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Competition Points</p>
          <p className="text-3xl font-black text-white">{summary.competitionPoints.toLocaleString()}</p>
          <p className="text-[9px] text-purple-400 font-extrabold uppercase">Arena Rank #{summary.globalRank}</p>
        </Card>

        <Card className="border-zinc-900 bg-zinc-950/40 p-5 space-y-2 relative overflow-hidden">
          <div className="absolute top-3 right-3 text-cyan-500/10">
            <Sparkles className="h-10 w-10" />
          </div>
          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Average score XP</p>
          <p className="text-3xl font-black text-white">{summary.avgScore} XP</p>
          <p className="text-[9px] text-zinc-550 font-bold uppercase">Milestones targets secure</p>
        </Card>
      </div>

      {/* 5. Dual Grid: AI Predictions vs Goal progress checks */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Left Column (2/3 width): AI insights predictions card */}
        <Card className="md:col-span-2 border-zinc-900 bg-zinc-950/20 backdrop-blur-xl relative overflow-hidden p-6 space-y-5">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/3 via-transparent to-transparent pointer-events-none" />
          
          <div className="flex items-center gap-2 pb-4 border-b border-zinc-900/60">
            <Sparkles className="h-5 w-5 text-purple-400 animate-pulse animate-bounce" />
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider">AI Forecast & Performance Predictions</h3>
              <span className="text-[8px] text-zinc-500 font-extrabold uppercase">Generated continuously based on proctor logs</span>
            </div>
          </div>

          <div className="space-y-4 text-xs font-bold leading-relaxed text-zinc-400">
            <p className="pl-3 border-l-2 border-purple-500">{insights.learningPredictions}</p>
            <p className="pl-3 border-l-2 border-cyan-400">{insights.growthForecasts}</p>
            
            <div className="space-y-2 pt-2">
              <span className="text-[8px] font-bold text-zinc-550 uppercase tracking-widest pl-0.5">Actionable Coaching Targets</span>
              <div className="space-y-2 text-[10px] text-zinc-500 font-semibold leading-normal list-decimal pl-1.5">
                {insights.suggestions.map((sug, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <CheckCircle className="h-4.5 w-4.5 text-cyan-400 shrink-0 mt-0.5 animate-pulse" />
                    <span>{sug}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Right Column (1/3 width): Goals completion checks */}
        <div className="space-y-6">
          <Card className="border-zinc-900 bg-zinc-950/40 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/2 via-transparent to-transparent pointer-events-none" />
            
            <CardHeader className="pb-4">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-400 pl-0.5 flex items-center gap-1">
                <Target className="h-4.5 w-4.5 text-cyan-400" /> Goal Completion Matrix
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-5 pb-5 border-t border-zinc-900/50 pt-5 text-xs font-bold text-zinc-400">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[8px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">
                  <span>Daily Goal</span>
                  <span>{goals.dailyProgress}%</span>
                </div>
                <Progress value={goals.dailyProgress} className="h-2 bg-zinc-900 border border-zinc-850" />
              </div>

              <div className="space-y-1.5 border-t border-zinc-900/30 pt-3">
                <div className="flex justify-between items-center text-[8px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">
                  <span>Weekly Goal</span>
                  <span>{goals.weeklyProgress}%</span>
                </div>
                <Progress value={goals.weeklyProgress} className="h-2 bg-zinc-900 border border-zinc-850" />
              </div>

              <div className="space-y-1.5 border-t border-zinc-900/30 pt-3">
                <div className="flex justify-between items-center text-[8px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">
                  <span>Monthly Goal</span>
                  <span>{goals.monthlyProgress}%</span>
                </div>
                <Progress value={goals.monthlyProgress} className="h-2 bg-zinc-900 border border-zinc-850" />
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
}
