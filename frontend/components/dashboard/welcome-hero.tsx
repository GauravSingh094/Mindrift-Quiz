"use client";

import React from "react";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Flame, Trophy, Award, Sparkles, LayoutDashboard } from "lucide-react";

interface WelcomeHeroProps {
  streak?: number;
  rank?: string;
  points?: number;
  badgesCount?: number;
}

export function WelcomeHero({
  streak = 5,
  rank = "#12",
  points = 3450,
  badgesCount = 8,
}: WelcomeHeroProps) {
  const { user } = useUser();
  const userName = user?.firstName || user?.username || "Learner";

  const getMotivationalQuote = () => {
    const quotes = [
      "Ready to scale your competence today?",
      "Crush today's learning goals and lock down your streak.",
      "A new competition is starting soon. Ready to take the trophy?",
      "AI has analyzed your skill gaps and prepared new quiz recommendations.",
    ];
    // Return quote based on date or username length
    return quotes[userName.length % quotes.length];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)] shadow-purple-500/5"
    >
      {/* Background Neon Glow Vectors */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-br from-purple-500/10 via-cyan-500/5 to-transparent blur-3xl rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5 pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Active Session Sync</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            Welcome back, {userName}
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed font-semibold">
            {getMotivationalQuote()}
          </p>
        </div>

        {/* Dynamic Achievements / Streak Counters widgets */}
        <div className="flex flex-wrap gap-4 items-center">
          {/* Streak */}
          <div className="flex items-center gap-3 p-3 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl shadow-xl min-w-[125px]">
            <div className="bg-orange-500/15 border border-orange-500/25 p-2 rounded-xl text-orange-400">
              <Flame className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Streak</p>
              <p className="text-lg font-black text-white">{streak} Days</p>
            </div>
          </div>

          {/* Rank */}
          <div className="flex items-center gap-3 p-3 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl shadow-xl min-w-[125px]">
            <div className="bg-cyan-500/15 border border-cyan-500/25 p-2 rounded-xl text-cyan-400">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Global Rank</p>
              <p className="text-lg font-black text-white">{rank}</p>
            </div>
          </div>

          {/* Achievements */}
          <div className="flex items-center gap-3 p-3 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl shadow-xl min-w-[125px]">
            <div className="bg-purple-500/15 border border-purple-500/25 p-2 rounded-xl text-purple-400">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Badges</p>
              <p className="text-lg font-black text-white">{badgesCount}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default WelcomeHero;
