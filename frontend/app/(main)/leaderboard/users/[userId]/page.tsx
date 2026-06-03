"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getUserRankProfile } from "@/features/leaderboard/api";
import { LeaderboardUser } from "@/features/leaderboard/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Calendar,
  Users,
  Award,
  Zap,
  TrendingUp,
  Bookmark,
  Layers,
  Database,
  Cpu,
  Loader2,
  Lock,
  ArrowLeft
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function UserRankingProfilePage() {
  const { userId } = useParams();
  const router = useRouter();

  const [user, setUser] = useState<LeaderboardUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      try {
        const data = await getUserRankProfile(userId as string);
        setUser(data);
      } catch (err) {
        toast.error("Failed to load user ranking profile.");
      } finally {
        setIsLoading(false);
      }
    }
    if (userId) loadProfile();
  }, [userId]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <p className="text-sm text-zinc-500 font-semibold tracking-wide animate-pulse">
          Retrieving user rank ledger...
        </p>
      </div>
    );
  }

  const categoryCards = [
    { title: "Frontend Focus", points: user.categoryPoints.Frontend || 0, rank: user.categoryRanks.Frontend || 99, icon: <Layers className="h-4.5 w-4.5 text-purple-400" /> },
    { title: "Backend Focus", points: user.categoryPoints.Backend || 0, rank: user.categoryRanks.Backend || 99, icon: <Database className="h-4.5 w-4.5 text-cyan-400" /> },
    { title: "AI Core", points: user.categoryPoints.AI || 0, rank: user.categoryRanks.AI || 99, icon: <Cpu className="h-4.5 w-4.5 text-purple-400" /> },
    { title: "DevOps Ops", points: user.categoryPoints.DevOps || 0, rank: user.categoryRanks.DevOps || 99, icon: <Zap className="h-4.5 w-4.5 text-cyan-400" /> }
  ];

  return (
    <div className="container px-4 py-8 mx-auto max-w-5xl space-y-8 relative z-10">
      
      {/* Back button */}
      <Button 
        onClick={() => router.push("/leaderboard")}
        variant="ghost" 
        className="text-zinc-500 hover:text-zinc-300 text-xs font-extrabold uppercase tracking-wider p-0 bg-transparent hover:bg-transparent"
      >
        ← Back to Standings
      </Button>

      {/* User Hero Stand Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-zinc-900 bg-zinc-950/40 relative overflow-hidden p-6 md:p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/3 via-transparent to-transparent pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
            
            {/* Left: Avatar name details */}
            <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-xl font-bold text-white uppercase border-2 border-background shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                {user.name.slice(0, 2)}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <h1 className="text-xl md:text-2xl font-black text-white tracking-wide">
                    {user.name}
                  </h1>
                  <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[8px] font-bold uppercase rounded-full">
                    {user.tier} Tier
                  </Badge>
                </div>
                <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">@{user.username}</p>
                <div className="flex gap-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5 mt-2">
                  <span>Streak: {user.streak} days</span>
                  <span>Achievements: {user.achievementScore} pts</span>
                </div>
              </div>
            </div>

            {/* Right: Big KPI pedestal stands */}
            <div className="flex gap-6 min-w-[200px] justify-center md:justify-end text-center">
              <div className="bg-zinc-900/40 border border-zinc-900 px-5 py-3.5 rounded-2xl min-w-[100px]">
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5 block">Global Rank</span>
                <span className="text-xl md:text-2xl font-black text-purple-400 tracking-wider">#{user.globalRank}</span>
              </div>
              <div className="bg-zinc-900/40 border border-zinc-900 px-5 py-3.5 rounded-2xl min-w-[100px]">
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5 block">Total Score</span>
                <span className="text-xl md:text-2xl font-black text-cyan-400 tracking-wider font-mono">{user.score.toLocaleString()}</span>
              </div>
            </div>

          </div>
        </Card>
      </motion.div>

      {/* Grid: Left Column (3 Category Ranks & Progression), Right Column (2 specs) */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Left Column (2/3 width): Category breakdown and chart progression */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Category break down cards */}
          <div className="space-y-3.5">
            <h2 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest pl-0.5">Category Skill Points</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {categoryCards.map((card) => (
                <div
                  key={card.title}
                  className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-2xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {card.icon}
                    <div>
                      <p className="text-xs font-black text-white">{card.title}</p>
                      <p className="text-[10px] font-mono text-zinc-500 font-extrabold uppercase mt-0.5">Ranked #{card.rank}</p>
                    </div>
                  </div>
                  <span className="text-xs font-black font-mono text-cyan-400">{card.points.toLocaleString()} XP</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recharts Line progression */}
          {mounted && user.rankHistory && (
            <Card className="border-zinc-900 bg-zinc-950/20 backdrop-blur-xl overflow-hidden min-h-[300px] flex flex-col justify-between">
              <CardHeader className="pb-3 border-b border-zinc-900/50">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 pl-0.5">
                  <TrendingUp className="h-4.5 w-4.5 text-purple-400" />
                  <span>Rank Position Journey timeline</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 flex-1 flex items-center justify-center">
                <div className="w-full h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={user.rankHistory} margin={{ left: -25, right: 10, top: 10, bottom: 0 }}>
                      <XAxis dataKey="date" stroke="#52525b" style={{ fontSize: "10px", fontWeight: "bold" }} />
                      <YAxis reversed stroke="#52525b" style={{ fontSize: "10px", fontWeight: "bold" }} />
                      <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#18181b", fontSize: "11px", fontWeight: "bold" }} />
                      <Line type="monotone" dataKey="rank" stroke="#a855f7" strokeWidth={3} dot={{ fill: "#a855f7", strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column (1/3 width): Milestones check logs */}
        <div className="space-y-6">
          <Card className="border-zinc-900 bg-zinc-950/40 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/2 via-transparent to-transparent pointer-events-none" />
            
            <CardHeader className="pb-4">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                Sealed Credentials
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 pb-4 border-t border-zinc-900/50 pt-4 text-xs font-bold text-zinc-400">
              <div className="flex justify-between items-center pl-0.5">
                <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Academic Grade</span>
                <span className="text-white">Expert Masters</span>
              </div>
              <div className="flex justify-between items-center pl-0.5 border-t border-zinc-900/30 pt-3">
                <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Competition score</span>
                <span className="text-white">{user.competitionPoints.toLocaleString()} XP</span>
              </div>
              <div className="flex justify-between items-center pl-0.5 border-t border-zinc-900/30 pt-3">
                <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Continuous Streak</span>
                <span className="text-white">{user.streak} days</span>
              </div>
              <div className="flex justify-between items-center pl-0.5 border-t border-zinc-900/30 pt-3">
                <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Graded Accuracy</span>
                <span className="text-white">{user.accuracy}% average</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick info panel */}
          <div className="p-4 bg-zinc-950/30 border border-zinc-900/60 rounded-2xl space-y-2">
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5 flex items-center gap-1">
              <Bookmark className="h-3.5 w-3.5 text-cyan-400" /> Competitor Verification
            </p>
            <p className="text-[11px] text-zinc-500 font-semibold leading-relaxed">
              All contestant scoreboards are synced with proctored SSO session telemetry keys and sealed under cryptographic hashes.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
