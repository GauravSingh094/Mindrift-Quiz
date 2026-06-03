"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, ArrowRight, Brain, Milestone, Terminal, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";

interface RecommendationItem {
  type: "quiz" | "path" | "interview" | "gap";
  title: string;
  meta: string;
  description: string;
  badgeText: string;
  icon: React.ReactNode;
}

const mockRecommendations: RecommendationItem[] = [
  {
    type: "gap",
    title: "Docker Multistage Builds & Layer Caching",
    meta: "Identified Skill Gap &bull; High priority",
    description: "System diagnostics logged minor latency gaps in devops cache layouts. Complete this to bridge.",
    badgeText: "DevOps",
    icon: <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />,
  },
  {
    type: "quiz",
    title: "Java Memory Model & G1 GC Internals",
    meta: "Based on Python & Backend success",
    description: "We recommend an advanced test on JVM heap structures, memory leaks, and GC roots.",
    badgeText: "JVM",
    icon: <Brain className="h-4.5 w-4.5 text-cyan-400" />,
  },
  {
    type: "path",
    title: "Advanced System Design Architect",
    meta: "Active Learning Path",
    description: "Resume roadmap: Segment 4 of 12 (Consistency Models, Paxos, and Distributed Consensus).",
    badgeText: "Architect",
    icon: <Milestone className="h-4.5 w-4.5 text-purple-400" />,
  },
  {
    type: "interview",
    title: "Python Data Structures & Complexity",
    meta: "Technical Interview Prep",
    description: "Targeted mocks testing algorithmic runtimes, tree traversals, and dynamic array allocations.",
    badgeText: "Algorithms",
    icon: <Terminal className="h-4.5 w-4.5 text-emerald-400 animate-pulse" />,
  },
];

export function AiRecommendations() {
  return (
    <Card className="border-zinc-900 bg-zinc-950/40 backdrop-blur-xl shadow-2xl relative overflow-hidden h-full">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/2 via-transparent to-transparent pointer-events-none" />

      <CardHeader className="pb-4 border-b border-zinc-900/50">
        <CardTitle className="text-base font-black tracking-tight text-white flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-400 animate-pulse" />
          <span>AI Adaptive Recommendations</span>
        </CardTitle>
        <CardDescription className="text-[11px] text-zinc-500 font-semibold mt-0.5">
          Real-time cognitive roadmaps computed specifically for you.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-5 space-y-4">
        {mockRecommendations.map((rec, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className="flex flex-col sm:flex-row items-start justify-between p-4 bg-zinc-900/10 border border-zinc-900 rounded-2xl hover:border-zinc-800 transition-all duration-300 gap-4"
          >
            <div className="flex gap-3">
              <div className="p-2 bg-zinc-900 border border-zinc-850 rounded-xl h-fit">
                {rec.icon}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-bold text-white tracking-wide">
                    {rec.title}
                  </h4>
                  <span className="text-[8px] font-extrabold uppercase bg-purple-500/15 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-full">
                    {rec.badgeText}
                  </span>
                </div>
                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                  {rec.meta}
                </p>
                <p className="text-[10px] text-zinc-500 leading-normal max-w-[280px]">
                  {rec.description}
                </p>
              </div>
            </div>

            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-8 border border-zinc-850 bg-zinc-950 text-zinc-400 hover:text-white hover:border-purple-500/30 text-xs rounded-xl font-bold gap-1 mt-2 sm:mt-0"
            >
              <Link href="/quizzes">
                <span>Start</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}

export default AiRecommendations;
