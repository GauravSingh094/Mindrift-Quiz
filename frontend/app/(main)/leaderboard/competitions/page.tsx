"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getCompetitionWinners } from "@/features/leaderboard/api";
import { CompetitionWinner } from "@/features/leaderboard/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Calendar,
  Users,
  Award,
  Zap,
  ArrowRight,
  TrendingUp,
  History,
  Loader2,
  Lock,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Link from "next/link";

export default function CompetitionRankingsPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [winners, setWinners] = useState<CompetitionWinner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadWinners() {
      setIsLoading(true);
      try {
        const data = await getCompetitionWinners();
        setWinners(data);
      } catch (err) {
        toast.error("Failed to load competition rankings.");
      } finally {
        setIsLoading(false);
      }
    }
    loadWinners();
  }, []);

  const navLinks = [
    { href: "/leaderboard", label: "Global" },
    { href: "/leaderboard/categories", label: "Categories" },
    { href: "/leaderboard/seasons", label: "Seasons" },
    { href: "/leaderboard/competitions", label: "Competitions" },
    { href: "/leaderboard/hall-of-fame", label: "Hall of Fame" }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <p className="text-sm text-zinc-500 font-semibold tracking-wide animate-pulse">
          Retrieving match history...
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
            Tournament Match Winners
          </h1>
          <p className="text-xs text-zinc-500 font-semibold mt-1">
            Historic listings of proctored match arena champions, final scoreboards, and participant pools.
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

      {/* Ranks list grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {winners.map((winner, idx) => (
          <motion.div
            key={winner.competitionId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
          >
            <Card className="border-zinc-900 bg-zinc-950/40 relative overflow-hidden group hover:border-zinc-800 transition-all flex flex-col justify-between min-h-[220px]">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/2 via-transparent to-transparent pointer-events-none" />
              
              <CardHeader className="space-y-2 pb-4">
                <div className="flex justify-between items-center w-full">
                  <span className="text-[8px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 animate-pulse">
                    Live Champions Graded
                  </span>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(winner.date).toLocaleDateString()}
                  </span>
                </div>
                <CardTitle className="text-sm font-bold text-white tracking-wide group-hover:text-purple-400 transition-colors">
                  {winner.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3 pb-4">
                {/* Champion highlight */}
                <div className="p-3.5 bg-zinc-900/40 border border-zinc-900/60 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">
                    <Award className="h-4 w-4 text-yellow-500 animate-bounce" />
                    <span>Grand Champion Roster</span>
                  </div>
                  <p className="text-xs font-black text-white">{winner.winnerName}</p>
                  <p className="text-xs font-black font-mono text-cyan-400">{winner.winnerScore.toLocaleString()} XP earned</p>
                </div>

                <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider pl-0.5">
                  <Users className="h-4 w-4 text-purple-400" />
                  <span>{winner.participantsCount} Connected Competitors participated</span>
                </div>
              </CardContent>

              <CardFooter className="pt-2 border-t border-zinc-900/50 bg-zinc-950/20">
                <Button
                  onClick={() => router.push(`/competitions/${winner.competitionId}/leaderboard`)}
                  className="w-full bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white font-extrabold h-10 rounded-xl text-xs gap-1 transition-all"
                >
                  <span>Examine Detailed Scoreboard</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}

        {winners.length === 0 && (
          <div className="md:col-span-2 text-center py-16 p-6 bg-zinc-950/20 border border-zinc-900 rounded-2xl">
            <Trophy className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">No Competitions Concluded</h3>
            <p className="text-[11px] text-zinc-600 font-semibold max-w-xs mx-auto mt-1 leading-relaxed">
              Standings archives of finished match tournaments will reside in this lounge.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
