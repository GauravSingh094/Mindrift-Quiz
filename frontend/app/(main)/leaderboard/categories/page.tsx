"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getGlobalLeaderboard } from "@/features/leaderboard/api";
import { LeaderboardUser } from "@/features/leaderboard/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Brain,
  Code,
  Database,
  Cpu,
  Layers,
  Terminal,
  Loader2,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function CategoryLeaderboardPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Frontend");

  const categories = ["Frontend", "Backend", "AI", "DevOps", "Java", "Python", "System Design", "DSA"];

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await getGlobalLeaderboard();
        setUsers(data);
      } catch (err) {
        toast.error("Failed to load category standings.");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const sortedCategoryUsers = [...users]
    .map((u) => ({
      ...u,
      points: u.categoryPoints[selectedCategory] || 0,
      rank: u.categoryRanks[selectedCategory] || 99
    }))
    .filter(u => u.points > 0)
    .sort((a, b) => b.points - a.points);

  const navLinks = [
    { href: "/leaderboard", label: "Global" },
    { href: "/leaderboard/categories", label: "Categories" },
    { href: "/leaderboard/seasons", label: "Seasons" },
    { href: "/leaderboard/competitions", label: "Competitions" },
    { href: "/leaderboard/hall-of-fame", label: "Hall of Fame" }
  ];

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "Frontend": return <Layers className="h-4 w-4" />;
      case "Backend": return <Database className="h-4 w-4" />;
      case "AI": return <Cpu className="h-4 w-4" />;
      case "DevOps": return <Brain className="h-4 w-4" />;
      default: return <Code className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <p className="text-sm text-zinc-500 font-semibold tracking-wide animate-pulse">
          Indexing category clusters...
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
            Category Focus Standings
          </h1>
          <p className="text-xs text-zinc-500 font-semibold mt-1">
            Compare participant scores, point counts, and ranks categorized across focal engineering fields.
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

      {/* Flagship layout: left category selector list, right standings table */}
      <div className="grid gap-6 md:grid-cols-4">
        
        {/* Category Toggles Sidebar (1/4 width) */}
        <div className="flex flex-col gap-2">
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-2.5 text-xs font-bold p-3.5 rounded-xl transition-all border uppercase tracking-wider text-left ${
                  active
                    ? "bg-purple-500/10 border-purple-500 text-purple-400"
                    : "bg-zinc-950/40 border-zinc-900 text-zinc-500 hover:border-zinc-850 hover:text-zinc-300"
                }`}
              >
                {getCategoryIcon(cat)}
                <span>{cat}</span>
              </button>
            );
          })}
        </div>

        {/* Category Rankings Board (3/4 width) */}
        <div className="md:col-span-3 space-y-4">
          <div className="flex justify-between items-center pl-0.5">
            <h2 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span>{selectedCategory} Standings Roster</span>
            </h2>
            <span className="text-[9px] text-zinc-500 font-bold uppercase">{sortedCategoryUsers.length} active master{sortedCategoryUsers.length !== 1 ? "s" : ""}</span>
          </div>

          <Card className="border-zinc-900 bg-zinc-950/40 backdrop-blur-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs font-bold text-zinc-400">
                <thead>
                  <tr className="border-b border-zinc-900 text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 bg-zinc-950/40">
                    <th className="px-6 py-4.5 w-16">Rank</th>
                    <th className="px-6 py-4.5">Contestant</th>
                    <th className="px-6 py-4.5 text-right">{selectedCategory} points</th>
                    <th className="px-6 py-4.5 text-center">Global standing</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {sortedCategoryUsers.map((user, idx) => {
                      const isUser = user.id === "user_demo";
                      return (
                        <motion.tr
                          key={user.id}
                          layoutId={`cat_row_${user.id}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className={`border-b border-zinc-900/60 hover:bg-zinc-900/10 transition-all ${
                            isUser ? "bg-purple-950/5 text-white" : ""
                          }`}
                        >
                          <td className="px-6 py-4.5 font-mono text-[11px] font-extrabold text-zinc-500">
                            #{idx + 1}
                          </td>
                          <td className="px-6 py-4.5">
                            <div className="flex items-center gap-2.5">
                              <div className="h-6.5 w-6.5 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center text-[9px] font-bold text-white uppercase shrink-0">
                                {user.name.slice(0, 2)}
                              </div>
                              <div>
                                <p className="text-zinc-200 leading-none">{user.name}</p>
                                <p className="text-[9px] text-zinc-500 font-semibold mt-0.5">@{user.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4.5 text-right font-black font-mono tracking-wide text-cyan-400">
                            {user.points.toLocaleString()} XP
                          </td>
                          <td className="px-6 py-4.5 text-center">
                            <Badge className="bg-zinc-900 text-zinc-500 border border-zinc-800 text-[8px] font-bold uppercase rounded-full">
                              Global #{user.globalRank}
                            </Badge>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>

                  {sortedCategoryUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-zinc-600 uppercase tracking-widest text-[10px]">
                        No active records in this category
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
