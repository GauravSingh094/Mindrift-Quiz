"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PlusCircle, Target, Sparkles, Trophy, BookOpen, ArrowUpRight } from "lucide-react";

interface ActionItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  glow: string;
}

const actions: ActionItem[] = [
  {
    title: "Create standard Quiz",
    description: "Design custom questions, options, and difficulty limits.",
    icon: <PlusCircle className="h-5 w-5 text-blue-400" />,
    href: "/create",
    color: "group-hover:border-blue-500/30 group-hover:bg-blue-500/5",
    glow: "group-hover:shadow-blue-500/5",
  },
  {
    title: "Join competitive Arena",
    description: "Enter an active WebSocket battle against online peers.",
    icon: <Target className="h-5 w-5 text-purple-400" />,
    href: "/admin/competitions/join",
    color: "group-hover:border-purple-500/30 group-hover:bg-purple-500/5",
    glow: "group-hover:shadow-purple-500/5",
  },
  {
    title: "Generate AI Quiz",
    description: "Prompt our LLM model to instantly spawn optimized questions.",
    icon: <Sparkles className="h-5 w-5 text-cyan-400 animate-pulse" />,
    href: "/create?ai=true",
    color: "group-hover:border-cyan-500/30 group-hover:bg-cyan-500/5",
    glow: "group-hover:shadow-cyan-500/5",
  },
  {
    title: "View global Rankings",
    description: "Check user levels and inspect top platform players.",
    icon: <Trophy className="h-5 w-5 text-yellow-400" />,
    href: "/leaderboard",
    color: "group-hover:border-yellow-500/30 group-hover:bg-yellow-500/5",
    glow: "group-hover:shadow-yellow-500/5",
  },
  {
    title: "Continue learning Track",
    description: "Resume your active skill roadmap where you left off.",
    icon: <BookOpen className="h-5 w-5 text-emerald-400" />,
    href: "/quizzes",
    color: "group-hover:border-emerald-500/30 group-hover:bg-emerald-500/5",
    glow: "group-hover:shadow-emerald-500/5",
  },
];

export function QuickActions() {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
        Quick Action Command Center
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {actions.map((act, idx) => (
          <Link href={act.href} key={idx} className="group outline-none">
            <motion.div
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              className={`bg-zinc-950/40 border border-zinc-900 rounded-2xl p-4.5 flex flex-col justify-between h-[125px] transition-all duration-300 shadow-lg ${act.color} ${act.glow}`}
            >
              <div className="flex justify-between items-center w-full">
                <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl group-hover:border-transparent transition-colors">
                  {act.icon}
                </div>
                <ArrowUpRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-300 transition-colors opacity-0 group-hover:opacity-100" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white tracking-wide group-hover:text-purple-400 transition-colors">
                  {act.title}
                </h4>
                <p className="text-[10px] text-zinc-500 font-medium leading-normal mt-0.5 max-w-[160px]">
                  {act.description}
                </p>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default QuickActions;
