"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Trophy, Target, Award, Zap, Hourglass, TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

interface StatItemProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  subtitle?: string;
  delayIndex?: number;
}

function StatItem({ title, value, icon, trend, subtitle, delayIndex = 0 }: StatItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delayIndex * 0.05 }}
    >
      <Card className="border-zinc-900 bg-zinc-950/40 backdrop-blur-xl relative overflow-hidden group shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:border-zinc-800/80 transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/2 via-transparent to-transparent pointer-events-none" />
        
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
            {title}
          </CardTitle>
          <div className="p-2 bg-zinc-900/50 border border-zinc-900 rounded-xl group-hover:text-purple-400 group-hover:scale-105 transition-all duration-300">
            {icon}
          </div>
        </CardHeader>
        <CardContent className="space-y-1.5">
          <div className="text-2xl font-black text-white tracking-tight">
            {value}
          </div>
          <div className="flex items-center gap-1.5 min-h-[16px]">
            {trend && (
              <span
                className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  trend.isPositive
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-red-500/10 text-red-400"
                }`}
              >
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{trend.value}</span>
              </span>
            )}
            {subtitle && (
              <span className="text-[10px] text-zinc-500 font-semibold">{subtitle}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface StatsGridProps {
  stats?: {
    quizzesCompleted: number;
    competitionsJoined: number;
    currentRank: string;
    accuracy: number;
    points: number;
    hours: number;
    trends?: {
      quizzes: string;
      competitions: string;
      rank: string;
      accuracy: string;
      points: string;
      hours: string;
    };
  };
}

export function StatsGrid({ stats }: StatsGridProps) {
  // Safe fallbacks for data
  const data = stats || {
    quizzesCompleted: 27,
    competitionsJoined: 8,
    currentRank: "#12",
    accuracy: 84.5,
    points: 3450,
    hours: 18.2,
    trends: {
      quizzes: "+12%",
      competitions: "+2",
      rank: "+4 places",
      accuracy: "+2.4%",
      points: "+650 xp",
      hours: "+3.5h",
    },
  };

  return (
    <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatItem
        title="Quizzes Taken"
        value={data.quizzesCompleted}
        icon={<Brain className="h-4.5 w-4.5 text-blue-400" />}
        trend={data.trends ? { value: data.trends.quizzes, isPositive: true } : undefined}
        subtitle="Completed attempts"
        delayIndex={0}
      />
      <StatItem
        title="Live Arenas"
        value={data.competitionsJoined}
        icon={<Target className="h-4.5 w-4.5 text-purple-400" />}
        trend={data.trends ? { value: data.trends.competitions, isPositive: true } : undefined}
        subtitle="Match attempts"
        delayIndex={1}
      />
      <StatItem
        title="Global Rank"
        value={data.currentRank}
        icon={<Trophy className="h-4.5 w-4.5 text-yellow-400" />}
        trend={data.trends ? { value: data.trends.rank, isPositive: true } : undefined}
        subtitle="Platform standing"
        delayIndex={2}
      />
      <StatItem
        title="Accuracy Rate"
        value={`${data.accuracy}%`}
        icon={<Award className="h-4.5 w-4.5 text-cyan-400" />}
        trend={data.trends ? { value: data.trends.accuracy, isPositive: true } : undefined}
        subtitle="Correct answers"
        delayIndex={3}
      />
      <StatItem
        title="Mindrift Points"
        value={data.points.toLocaleString()}
        icon={<Zap className="h-4.5 w-4.5 text-orange-400 animate-pulse" />}
        trend={data.trends ? { value: data.trends.points, isPositive: true } : undefined}
        subtitle="Total accumulated XP"
        delayIndex={4}
      />
      <StatItem
        title="Hours Spent"
        value={`${data.hours}h`}
        icon={<Hourglass className="h-4.5 w-4.5 text-emerald-400" />}
        trend={data.trends ? { value: data.trends.hours, isPositive: true } : undefined}
        subtitle="Total learning time"
        delayIndex={5}
      />
    </div>
  );
}

export default StatsGrid;
