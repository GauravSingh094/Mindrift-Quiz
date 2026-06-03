"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getUserProfile, getUserPreferences } from "@/features/settings/api";
import { UserProfile, UserPreferences } from "@/features/settings/types";
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
  ArrowLeft,
  Sparkles,
  Flame,
  Star,
  CheckCircle
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

export default function PublicProfilePage() {
  const { username } = useParams();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        // Fetch demo user profile matching username
        const data = await getUserProfile();
        setProfile(data);

        const prefBundle = await getUserPreferences();
        setPreferences(prefBundle.preferences);
      } catch (err) {
        toast.error("Failed to load public profile.");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [username]);

  if (isLoading || !profile || !preferences) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <p className="text-sm text-zinc-500 font-semibold tracking-wide animate-pulse">
          Calibrating public profile metrics...
        </p>
      </div>
    );
  }

  // Custom mock analytics data matching public users
  const radarData = [
    { subject: "Docker/Swarm", score: 88, average: 65 },
    { subject: "Backend API", score: 72, average: 58 },
    { subject: "System Design", score: 65, average: 52 },
    { subject: "Message Queue", score: 45, average: 60 },
    { subject: "Monitoring", score: 50, average: 61 }
  ];

  // Trophy badges list (Task 15)
  const trophiesCabinet = [
    { title: "Speed Demon", glow: "border-purple-500/30 text-purple-400 bg-purple-500/5", desc: "Docker Orchestration Speedrun" },
    { title: "JVM Architect", glow: "border-cyan-500/30 text-cyan-400 bg-cyan-500/5", desc: "Multithread Concurrency Hack" },
    { title: "Streak Master", glow: "border-yellow-500/30 text-yellow-500 bg-yellow-500/5", desc: "42 Continuous learning days" }
  ];

  const historicCompetitions = [
    { title: "Docker Orchestration Speed Run", rank: 2, score: 920, date: "2026-05-29" },
    { title: "Java Multi-Threading Hack", rank: 12, score: 780, date: "2026-05-24" }
  ];

  return (
    <div className="container px-4 py-8 mx-auto max-w-5xl space-y-8 relative z-10">
      
      {/* 1. Header Banner Showcase */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-double border-4 border-purple-500/25 bg-zinc-950/40 relative overflow-hidden p-6 md:p-8">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
            {/* Avatar details */}
            <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-xl font-bold text-white uppercase border-2 border-background shadow-[0_0_20px_rgba(168,85,247,0.15)] shrink-0">
                {profile.name.slice(0, 2)}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <h1 className="text-xl md:text-2xl font-black text-white tracking-wide uppercase">
                    {profile.name}
                  </h1>
                  <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[8px] font-bold uppercase rounded-full">
                    {preferences.accountStatus}
                  </Badge>
                </div>
                <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">@{profile.username}</p>
                <p className="text-[11px] text-zinc-400 font-semibold max-w-md leading-relaxed mt-2.5">
                  {profile.bio}
                </p>
              </div>
            </div>

            {/* Pedestal stats */}
            <div className="flex gap-6 min-w-[200px] justify-center md:justify-end text-center">
              <div className="bg-zinc-900/40 border border-zinc-900 px-5 py-3.5 rounded-2xl min-w-[100px]">
                <span className="text-[7px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5 block">Global Rank</span>
                <span className="text-xl md:text-2xl font-black text-purple-400 tracking-wider">#2</span>
              </div>
              <div className="bg-zinc-900/40 border border-zinc-900 px-5 py-3.5 rounded-2xl min-w-[100px]">
                <span className="text-[7px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5 block">Grand XP</span>
                <span className="text-xl md:text-2xl font-black text-cyan-400 tracking-wider font-mono">9,240</span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Grid Content */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Left Column (2/3 width): Radar skills distribution, trophies showcase, match history */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Recharts skill radar */}
          {mounted && (
            <Card className="border-zinc-900 bg-zinc-950/20 backdrop-blur-xl overflow-hidden min-h-[340px] flex flex-col justify-between">
              <CardHeader className="pb-3 border-b border-zinc-900/50 bg-zinc-950/20">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 pl-0.5">
                  <Sparkles className="h-4.5 w-4.5 text-purple-400" />
                  <span>Cognitive Skill Distribution Map</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 flex-1 flex items-center justify-center">
                <div className="w-full h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="#27272a" />
                      <PolarAngleAxis dataKey="subject" stroke="#71717a" style={{ fontSize: "10px", fontWeight: "bold" }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#27272a" style={{ fontSize: "9px" }} />
                      <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#18181b", fontSize: "11px", fontWeight: "bold" }} />
                      <Legend wrapperStyle={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase" }} />
                      <Radar name={profile.name} dataKey="score" stroke="#a855f7" fill="#a855f7" fillOpacity={0.3} />
                      <Radar name="Global Average Score" dataKey="average" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.1} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trophies & Badges Cabinet (Task 15) */}
          <div className="space-y-3.5">
            <h2 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest pl-0.5 flex items-center gap-1">
              <Star className="h-4.5 w-4.5 text-yellow-500 fill-yellow-500" /> Unlocked Credentials Cabinet
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {trophiesCabinet.map((badge) => (
                <div
                  key={badge.title}
                  className={`p-4 border rounded-2xl text-center space-y-1.5 flex flex-col justify-between min-h-[110px] ${badge.glow}`}
                >
                  <Award className="h-5 w-5 mx-auto animate-pulse" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider">{badge.title}</p>
                    <p className="text-[8px] text-zinc-500 font-semibold uppercase mt-0.5">{badge.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Match history listings */}
          <div className="space-y-3.5">
            <h2 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest pl-0.5">Competitive Arena Roster</h2>
            <div className="space-y-3">
              {historicCompetitions.map((comp) => (
                <div
                  key={comp.title}
                  className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-black text-white">{comp.title}</p>
                    <p className="text-[10px] text-zinc-500 font-semibold uppercase">Completed: {new Date(comp.date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-4 text-[10px] font-bold uppercase shrink-0">
                    <span className="text-purple-400">Podium Rank #{comp.rank}</span>
                    <span className="text-cyan-400 font-mono">{comp.score} XP</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1/3 width): Strengths tag matrix & continuous streaks */}
        <div className="space-y-6">
          
          {/* Continuous learning streaks milestones */}
          <Card className="border-zinc-900 bg-zinc-950/40 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/2 via-transparent to-transparent pointer-events-none" />
            
            <CardHeader className="pb-4">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1">
                <Flame className="h-4.5 w-4.5 text-cyan-400 animate-pulse" /> Streak Progress Check
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 pb-5 border-t border-zinc-900/50 pt-5 text-xs font-bold text-zinc-450 leading-relaxed">
              <div className="flex justify-between items-center pl-0.5">
                <span>Active Continuous Streak</span>
                <span className="text-cyan-400 font-black">42 Days</span>
              </div>
              <div className="flex gap-1.5 justify-center py-2.5">
                {Array.from({ length: 7 }).map((_, idx) => (
                  <CheckCircle key={idx} className="h-6 w-6 text-cyan-400 fill-cyan-400/5" />
                ))}
              </div>
              <p className="text-[10px] text-zinc-550 font-semibold leading-relaxed pl-0.5">
                ✓ Arthur Dent is currently in the top 1% of active streak holders inside Swarm and Kafka practices!
              </p>
            </CardContent>
          </Card>

          {/* Skill sets checklist */}
          <div className="p-4 bg-zinc-950/30 border border-zinc-900/60 rounded-2xl space-y-3.5">
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Focus Interests</p>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((int) => (
                <Badge key={int} className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[8px] font-bold uppercase rounded-full">
                  {int}
                </Badge>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
