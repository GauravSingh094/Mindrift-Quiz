"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getLeaderboardSeasons } from "@/features/leaderboard/api";
import { SeasonInfo } from "@/features/leaderboard/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  Calendar,
  Sparkles,
  Award,
  Zap,
  ArrowRight,
  TrendingUp,
  History,
  Loader2,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Link from "next/link";

export default function SeasonalLeaderboardPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [seasons, setSeasons] = useState<SeasonInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSeasons() {
      setIsLoading(true);
      try {
        const data = await getLeaderboardSeasons();
        setSeasons(data);
      } catch (err) {
        toast.error("Failed to load seasonal data archives.");
      } finally {
        setIsLoading(false);
      }
    }
    loadSeasons();
  }, []);

  const navLinks = [
    { href: "/leaderboard", label: "Global" },
    { href: "/leaderboard/categories", label: "Categories" },
    { href: "/leaderboard/seasons", label: "Seasons" },
    { href: "/leaderboard/competitions", label: "Competitions" },
    { href: "/leaderboard/hall-of-fame", label: "Hall of Fame" }
  ];

  // Separate Active and Past seasons
  const activeSeason = seasons.find((s) => s.status === "ACTIVE");
  const pastSeasons = seasons.filter((s) => s.status === "COMPLETED");

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <p className="text-sm text-zinc-500 font-semibold tracking-wide animate-pulse">
          Opening seasonal records...
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
              Ecosystem Leaderboard
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent mt-1.5">
            Seasonal Tournaments Ranks
          </h1>
          <p className="text-xs text-zinc-500 font-semibold mt-1">
            Examine active seasonal metrics, milestone completions, and historic season champions.
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

      {/* Flagship Active Season Hero Showcase */}
      {activeSeason && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-zinc-900 bg-zinc-950/40 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent pointer-events-none" />
            
            <CardHeader className="pb-4">
              <div className="flex flex-wrap justify-between items-center gap-2 w-full">
                <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1 font-bold text-[9px] uppercase tracking-wider rounded-full animate-pulse">
                  Active Championship Season
                </Badge>
                <span className="text-[10px] text-zinc-500 font-bold uppercase flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> Closes in 24 Days
                </span>
              </div>
              <CardTitle className="text-lg md:text-xl font-black text-white tracking-wide mt-3">
                {activeSeason.name}
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500 font-semibold mt-1">
                Accumulate seasonal points to climb tiers, unlock proctored master badges, and claim limited rewards.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pb-6 border-t border-zinc-900/50 pt-6">
              {/* Progress Milestones */}
              <div className="space-y-2 max-w-xl">
                <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-0.5">
                  <span>Seasonal Progress</span>
                  <span>{activeSeason.points.toLocaleString()} / 5,000 XP</span>
                </div>
                <Progress value={84} className="h-2.5 bg-zinc-900 border border-zinc-800" />
                <p className="text-[10px] text-zinc-500 font-semibold leading-relaxed">
                  ✓ You are 800 XP away from unlocking the **Season 1 Champion Credentials Frame**.
                </p>
              </div>

              {/* Active Champions podium list */}
              <div className="space-y-3.5">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider pl-0.5 flex items-center gap-1.5">
                  <Award className="h-4.5 w-4.5 text-yellow-500 animate-bounce" /> Active Season Leaderboard Champions
                </h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  {activeSeason.topPerformers.map((winner) => (
                    <div
                      key={winner.name}
                      className="p-4 bg-zinc-900/35 border border-zinc-900 rounded-2xl space-y-1.5"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-zinc-950 text-zinc-400 border border-zinc-850">
                          Podium #{winner.rank}
                        </span>
                        <Zap className="h-4 w-4 text-cyan-400" />
                      </div>
                      <p className="text-xs font-black text-white">{winner.name}</p>
                      <p className="text-xs font-black font-mono text-cyan-400">{winner.score.toLocaleString()} XP</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* 5. HISTORIC COMPLETED SEASONS LISTING */}
      <div className="space-y-4">
        <h2 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 pl-0.5">
          <History className="h-4 w-4 text-purple-400" />
          <span>Completed seasons history</span>
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          {pastSeasons.map((season) => (
            <motion.div
              key={season.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-zinc-900 bg-zinc-950/40 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                <CardHeader className="pb-3 space-y-2">
                  <div className="flex justify-between items-center w-full">
                    <span className="text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-850 text-zinc-500">
                      Archived / Closed
                    </span>
                    <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[8px] font-bold uppercase rounded-full">
                      {season.achievementsCount} Achievements Unlocked
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-bold text-white tracking-wide">
                    {season.name}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3 pb-4">
                  {/* Champions Podium inline */}
                  <div className="p-3 bg-zinc-900/40 border border-zinc-900 rounded-xl space-y-2">
                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Champions Podium</span>
                    <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 uppercase">
                      <span>#1: {season.topPerformers[0]?.name}</span>
                      <span>#2: {season.topPerformers[1]?.name}</span>
                      <span>#3: {season.topPerformers[2]?.name}</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-2 border-t border-zinc-900/50 bg-zinc-950/20 text-[9px] font-extrabold uppercase tracking-widest text-zinc-500 flex justify-center items-center gap-1">
                  <span>View Season Archive Details</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

    </div>
  );
}
