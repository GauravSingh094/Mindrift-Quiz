"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getLearningTimeline } from "@/features/analytics/api";
import { TimelineItem } from "@/features/analytics/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Brain,
  Cpu,
  Zap,
  Layers,
  ArrowRight,
  Sparkles,
  Bookmark,
  CheckCircle,
  HelpCircle,
  Loader2,
  Calendar,
  Award,
  Terminal,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Link from "next/link";

export default function LearningTimelinePage() {
  const router = useRouter();
  const pathname = usePathname();

  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTimeline() {
      setIsLoading(true);
      try {
        const data = await getLearningTimeline();
        setTimeline(data);
      } catch (err) {
        toast.error("Failed to load learning journey timeline.");
      } finally {
        setIsLoading(false);
      }
    }
    loadTimeline();
  }, []);

  const navLinks = [
    { href: "/analytics", label: "Overview" },
    { href: "/analytics/quizzes", label: "Quizzes" },
    { href: "/analytics/competitions", label: "Competitions" },
    { href: "/analytics/skills", label: "Skills Matrix" },
    { href: "/analytics/timeline", label: "Journey Timeline" }
  ];

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case "quiz": return <Terminal className="h-4.5 w-4.5 text-purple-400" />;
      case "competition": return <Trophy className="h-4.5 w-4.5 text-yellow-500 animate-bounce" />;
      case "achievement": return <Award className="h-4.5 w-4.5 text-cyan-400" />;
      case "ai": return <Sparkles className="h-4.5 w-4.5 text-purple-400" />;
      default: return <Bookmark className="h-4.5 w-4.5 text-zinc-500" />;
    }
  };

  const getTimelineBorder = (type: string) => {
    switch (type) {
      case "quiz": return "border-purple-500/20";
      case "competition": return "border-yellow-500/20";
      case "achievement": return "border-cyan-500/20";
      case "ai": return "border-purple-500/20";
      default: return "border-zinc-900";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <p className="text-sm text-zinc-500 font-semibold tracking-wide animate-pulse">
          Opening timeline vault...
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
              Growth Intelligence Console
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent mt-1.5 font-mono">
            Interactive Learning Journey
          </h1>
          <p className="text-xs text-zinc-500 font-semibold mt-1">
            Browse structured chronological milestones, completed quizzes, multiplayer podium finishes, unlocked streak awards.
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

      {/* Interactive Timeline track list (Task 7) */}
      <div className="relative pl-6 sm:pl-8 border-l border-zinc-900 max-w-2xl mx-auto space-y-8 py-4">
        {timeline.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className="relative"
          >
            {/* Timeline node icon */}
            <div className="absolute -left-[37px] sm:-left-[45px] top-1 h-7.5 w-7.5 sm:h-8.5 sm:w-8.5 rounded-full bg-black border border-zinc-900 flex items-center justify-center shadow-[0_0_10px_rgba(0,0,0,0.8)] z-10">
              {getTimelineIcon(item.type)}
            </div>

            <Card className={`border bg-zinc-950/40 relative overflow-hidden group hover:border-zinc-800 transition-all ${getTimelineBorder(item.type)}`}>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/1 via-transparent to-transparent pointer-events-none" />
              
              <CardHeader className="p-4 space-y-1.5">
                <div className="flex flex-wrap justify-between items-center gap-1.5 w-full">
                  <Badge className="bg-zinc-900 border border-zinc-850 text-zinc-500 text-[8px] font-bold uppercase rounded-full">
                    {item.type}
                  </Badge>
                  <span className="text-[9px] text-zinc-500 font-bold uppercase flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(item.date).toLocaleDateString()}
                  </span>
                </div>
                <CardTitle className="text-xs font-black text-white uppercase tracking-wider group-hover:text-purple-400 transition-colors">
                  {item.title}
                </CardTitle>
                <CardDescription className="text-[10px] text-zinc-500 font-semibold leading-relaxed leading-normal mt-1">
                  {item.description}
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        ))}

        {timeline.length === 0 && (
          <div className="text-center py-16 bg-zinc-950/20 border border-zinc-900 rounded-2xl">
            <Trophy className="h-10 w-10 text-zinc-750 mx-auto mb-3" />
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Timeline Empty</h3>
            <p className="text-[10px] text-zinc-650 font-semibold max-w-xs mx-auto mt-1 leading-relaxed">
              Standings archives of finished match tournaments will reside in this lounge.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
