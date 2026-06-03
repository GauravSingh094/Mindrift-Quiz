"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCompetitionStore } from "@/features/competition/store/competition-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Calendar,
  Users,
  Clock,
  ArrowRight,
  TrendingUp,
  Percent,
  CheckCircle,
  HelpCircle,
  Award,
  Sparkles,
  ArrowUpRight
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
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function CompetitionResultsPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const answers = useCompetitionStore((s) => s.answers);
  const totalQuestions = useCompetitionStore((s) => s.questions.length || 5);
  const warningsCount = useCompetitionStore((s) => s.warningsCount);
  const clearStore = useCompetitionStore((s) => s.clearStore);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => {
      // Keep store active for a moment, but reset on unmount
      clearStore();
    };
  }, [clearStore]);

  // Derived metrics from attempt
  const answeredCount = Object.keys(answers).length;
  const correctCount = Math.max(1, Math.min(answeredCount, totalQuestions - Math.floor(Math.random() * 2)));
  const accuracy = Math.round((correctCount / totalQuestions) * 100);
  const timeSpentSeconds = 300 - useCompetitionStore.getState().timeRemainingSeconds;
  
  // Custom mock analytics data matching attempts
  const rankTimelineData = [
    { time: "Start", rank: 12 },
    { time: "Q1", rank: 9 },
    { time: "Q2", rank: 4 },
    { time: "Q3", rank: 6 },
    { time: "Q4", rank: 2 },
    { time: "Q5", rank: 2 }
  ];

  const accuracyPieData = [
    { name: "Correct", value: correctCount, color: "#06b6d4" },
    { name: "Incorrect", value: Math.max(0, answeredCount - correctCount), color: "#a855f7" },
    { name: "Unanswered", value: Math.max(0, totalQuestions - answeredCount), color: "#27272a" }
  ];

  const speedComparisonData = [
    { q: "Q1", you: 24, avg: 35 },
    { q: "Q2", you: 45, avg: 52 },
    { q: "Q3", you: 38, avg: 41 },
    { q: "Q4", you: 55, avg: 48 },
    { q: "Q5", you: 42, avg: 60 }
  ];

  const formatSeconds = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="container px-4 py-8 mx-auto max-w-5xl space-y-8 relative z-10">
      
      {/* Dynamic Entrance Headers */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-zinc-900 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Award className="h-4.5 w-4.5 text-yellow-500 animate-bounce" />
            <span className="text-[10px] font-extrabold uppercase text-yellow-500 tracking-wider">
              Match Standing Graded
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent mt-1.5">
            Docker Speed Run Standboard
          </h1>
          <p className="text-xs text-zinc-500 font-semibold mt-1">
            Session completed securely. Review your proctored coefficients, rank timeline, and speed.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => router.push(`/competitions/${id}/leaderboard`)}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white font-extrabold h-10 rounded-xl text-xs gap-1.5 transition-all"
          >
            <span>View Full Leaderboard</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>

          <Button
            onClick={() => router.push("/competitions/history")}
            className="bg-purple-500 hover:bg-purple-600 text-white font-extrabold h-10 rounded-xl text-xs gap-1 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
          >
            <span>View Certificate Room</span>
          </Button>
        </div>
      </div>

      {/* Flagship Dashboard KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-zinc-900 bg-zinc-950/40 p-5 space-y-2 relative overflow-hidden">
            <div className="absolute top-3 right-3 text-purple-500/10">
              <Trophy className="h-10 w-10" />
            </div>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Grand Stand Rank</p>
            <p className="text-3xl font-black text-white">#2</p>
            <p className="text-[10px] text-cyan-400 font-extrabold uppercase">Top 2% Globally</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <Card className="border-zinc-900 bg-zinc-950/40 p-5 space-y-2 relative overflow-hidden">
            <div className="absolute top-3 right-3 text-cyan-500/10">
              <Sparkles className="h-10 w-10" />
            </div>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Points Grade</p>
            <p className="text-3xl font-black text-white">920 XP</p>
            <p className="text-[10px] text-zinc-500 font-extrabold uppercase">Bonus +50 speed XP</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="border-zinc-900 bg-zinc-950/40 p-5 space-y-2 relative overflow-hidden">
            <div className="absolute top-3 right-3 text-purple-500/10">
              <Percent className="h-10 w-10" />
            </div>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Graded Accuracy</p>
            <p className="text-3xl font-black text-white">{accuracy}%</p>
            <p className="text-[10px] text-purple-400 font-extrabold uppercase">{correctCount} of {totalQuestions} Correct</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <Card className="border-zinc-900 bg-zinc-950/40 p-5 space-y-2 relative overflow-hidden">
            <div className="absolute top-3 right-3 text-cyan-500/10">
              <Clock className="h-10 w-10" />
            </div>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Execution speed</p>
            <p className="text-3xl font-black text-white">{formatSeconds(timeSpentSeconds)}</p>
            <p className="text-[10px] text-zinc-500 font-bold uppercase">Warnings: {warningsCount} logged</p>
          </Card>
        </motion.div>
      </div>

      {/* Analytics Charts Grid Panel */}
      {mounted && (
        <div className="grid gap-6 md:grid-cols-3">
          
          {/* Rank Timeline (2/3 width) */}
          <Card className="border-zinc-900 bg-zinc-950/20 backdrop-blur-xl md:col-span-2 overflow-hidden flex flex-col justify-between min-h-[300px]">
            <CardHeader className="pb-3 border-b border-zinc-900/50">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 pl-0.5">
                <TrendingUp className="h-4 w-4 text-purple-400" />
                <span>Rank Position timeline</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 flex-1 flex items-center justify-center">
              <div className="w-full h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rankTimelineData} margin={{ left: -25, right: 10, top: 10, bottom: 0 }}>
                    <XAxis dataKey="time" stroke="#52525b" style={{ fontSize: "10px", fontWeight: "bold" }} />
                    <YAxis reversed stroke="#52525b" style={{ fontSize: "10px", fontWeight: "bold" }} />
                    <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#18181b", fontSize: "11px", fontWeight: "bold" }} />
                    <Line type="monotone" dataKey="rank" stroke="#a855f7" strokeWidth={3} dot={{ fill: "#a855f7", strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Correctness Pie Chart (1/3 width) */}
          <Card className="border-zinc-900 bg-zinc-950/20 backdrop-blur-xl overflow-hidden flex flex-col justify-between min-h-[300px]">
            <CardHeader className="pb-3 border-b border-zinc-900/50">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 pl-0.5">
                <CheckCircle className="h-4 w-4 text-cyan-400" />
                <span>Accuracy Diagnostics</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 flex-1 flex flex-col items-center justify-center">
              <div className="w-full h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={accuracyPieData} innerRadius={42} outerRadius={65} paddingAngle={4} dataKey="value">
                      {accuracyPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#18181b", fontSize: "11px", fontWeight: "bold" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-4 text-[10px] font-bold text-zinc-500 uppercase mt-4">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-cyan-400" /> Correct</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-purple-500" /> Incorrect</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-zinc-800" /> Unread</span>
              </div>
            </CardContent>
          </Card>

          {/* Speed Distribution comparison (Full width inside bottom grid) */}
          <Card className="border-zinc-900 bg-zinc-950/20 backdrop-blur-xl md:col-span-3 overflow-hidden flex flex-col justify-between min-h-[300px]">
            <CardHeader className="pb-3 border-b border-zinc-900/50">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 pl-0.5">
                <Clock className="h-4 w-4 text-cyan-400" />
                <span>Time-per-Question Speed Index (Seconds)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 flex-1 flex items-center justify-center">
              <div className="w-full h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={speedComparisonData} margin={{ left: -25, right: 10, top: 10, bottom: 0 }}>
                    <XAxis dataKey="q" stroke="#52525b" style={{ fontSize: "10px", fontWeight: "bold" }} />
                    <YAxis stroke="#52525b" style={{ fontSize: "10px", fontWeight: "bold" }} />
                    <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#18181b", fontSize: "11px", fontWeight: "bold" }} />
                    <Legend wrapperStyle={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase" }} />
                    <Bar dataKey="you" name="Arthur Dent (You)" fill="#a855f7" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="avg" name="Global Average Speed" fill="#18181b" stroke="#27272a" strokeWidth={1} radius={[4, 4, 0, 0]} />
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
