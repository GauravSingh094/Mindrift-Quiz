"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Award, Zap, Shield, Target, Flame, Milestone, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";

interface BadgeItem {
  id: string;
  name: string;
  description: string;
  unlockedAt: string;
  icon: React.ReactNode;
  color: string;
  border: string;
}

const mockBadges: BadgeItem[] = [
  {
    id: "b_1",
    name: "Architect Master",
    description: "Successfully solved 5 System Design challenges.",
    unlockedAt: "Unlocks next",
    icon: <Shield className="h-5 w-5" />,
    color: "bg-purple-500/10 text-purple-400",
    border: "border-purple-500/20",
  },
  {
    id: "b_2",
    name: "Polyglot Coder",
    description: "Completed quizzes in 4 separate languages.",
    unlockedAt: "2 days ago",
    icon: <Award className="h-5 w-5" />,
    color: "bg-cyan-500/10 text-cyan-400",
    border: "border-cyan-500/20",
  },
  {
    id: "b_3",
    name: "Speed Demon",
    description: "Submitted answers under 3 seconds on average.",
    unlockedAt: "5 days ago",
    icon: <Zap className="h-5 w-5" />,
    color: "bg-yellow-500/10 text-yellow-400",
    border: "border-yellow-500/20",
  },
];

export function AchievementsWidget() {
  const currentXP = 3450;
  const nextLevelXP = 5000;
  const progressPercent = Math.min((currentXP / nextLevelXP) * 100, 100);

  return (
    <Card className="border-zinc-900 bg-zinc-950/40 backdrop-blur-xl shadow-2xl relative overflow-hidden h-full">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/2 via-transparent to-transparent pointer-events-none" />

      <CardHeader className="pb-4 border-b border-zinc-900/50">
        <CardTitle className="text-base font-black tracking-tight text-white flex items-center gap-2">
          <Award className="h-5 w-5 text-purple-400" />
          <span>Milestones & Badges</span>
        </CardTitle>
        <CardDescription className="text-[11px] text-zinc-500 font-semibold mt-0.5">
          Accumulate XP points and lock down learning tiers.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-5 space-y-5">
        {/* Progress toward next level */}
        <div className="p-4 bg-zinc-900/15 border border-zinc-900 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold text-zinc-400">
            <span className="flex items-center gap-1">
              <Milestone className="h-4 w-4 text-purple-400 animate-pulse" />
              <span>Level 7 Progress</span>
            </span>
            <span className="text-[11px] font-extrabold text-white">
              {currentXP} / {nextLevelXP} XP
            </span>
          </div>
          <Progress value={progressPercent} className="h-2 bg-zinc-900" />
          <p className="text-[10px] text-zinc-500 font-medium">
            Accumulate {nextLevelXP - currentXP} more XP to reach Level 8.
          </p>
        </div>

        {/* Badges Grid */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">
            Unlocked Milestones
          </h4>
          <div className="grid grid-cols-1 gap-2.5">
            {mockBadges.map((badge, idx) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className={`p-3 border rounded-xl flex items-center justify-between gap-3 ${badge.border} bg-zinc-900/5 hover:bg-zinc-900/10 transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${badge.border} ${badge.color}`}>
                    {badge.icon}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white tracking-wide">
                      {badge.name}
                    </h5>
                    <p className="text-[10px] text-zinc-500 leading-normal font-medium max-w-[190px]">
                      {badge.description}
                    </p>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-zinc-500 uppercase whitespace-nowrap">
                  {badge.unlockedAt}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AchievementsWidget;
