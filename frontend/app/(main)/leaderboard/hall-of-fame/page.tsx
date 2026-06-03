"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getHallOfFame } from "@/features/leaderboard/api";
import { HallOfFameRecord } from "@/features/leaderboard/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Sparkles,
  Award,
  Zap,
  Loader2,
  Calendar,
  Bookmark
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Link from "next/link";

export default function HallOfFamePage() {
  const router = useRouter();
  const pathname = usePathname();

  const [records, setRecords] = useState<HallOfFameRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRecords() {
      setIsLoading(true);
      try {
        const data = await getHallOfFame();
        setRecords(data);
      } catch (err) {
        toast.error("Failed to load Hall of Fame legends.");
      } finally {
        setIsLoading(false);
      }
    }
    loadRecords();
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
          Polishing hall of fame frames...
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
            Hall of Fame Legends
          </h1>
          <p className="text-xs text-zinc-500 font-semibold mt-1">
            Browse legendary engineers, historic champions, and persistent milestone record holders.
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

      {/* Roster of Legendary Players */}
      <div className="grid gap-6 md:grid-cols-3">
        {records.map((record, idx) => (
          <motion.div
            key={record.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
          >
            <Card className="border-double border-4 border-purple-500/20 bg-zinc-950/40 relative overflow-hidden flex flex-col justify-between min-h-[260px] text-center p-5">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/3 via-transparent to-transparent pointer-events-none" />
              
              <div className="space-y-4">
                {/* Crest */}
                <div className="h-14 w-14 rounded-full border-[3px] border-double border-yellow-500/20 bg-yellow-500/5 flex items-center justify-center text-xs font-bold text-white uppercase mx-auto shadow-[0_0_15px_rgba(234,179,8,0.05)]">
                  <Award className="h-6 w-6 text-yellow-500" />
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase text-yellow-500 tracking-widest block pl-0.5">
                    {record.title}
                  </span>
                  <h3 className="text-sm font-black text-white uppercase tracking-wide">
                    {record.name}
                  </h3>
                </div>

                <p className="text-[11px] text-zinc-500 font-semibold leading-relaxed max-w-[200px] mx-auto">
                  {record.achievement}
                </p>
              </div>

              {/* sealed metadata */}
              <div className="border-t border-zinc-900/60 pt-4 mt-4 space-y-1">
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5 block">Record sealed</span>
                <p className="text-[10px] font-mono font-black text-cyan-400 uppercase tracking-wide leading-none mt-1">
                  {record.metricValue}
                </p>
              </div>

            </Card>
          </motion.div>
        ))}
      </div>

    </div>
  );
}
