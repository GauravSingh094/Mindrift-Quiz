"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getGlobalLeaderboard } from "@/features/leaderboard/api";
import { LeaderboardUser } from "@/features/leaderboard/types";
import { useLeaderboardStore } from "@/features/leaderboard/store/leaderboard-store";
import { useLeaderboardWebSocket } from "@/features/leaderboard/hooks/use-leaderboard-websocket";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Trophy,
  Search,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
  Zap,
  ArrowUpRight,
  UserPlus,
  ArrowRightLeft,
  Loader2,
  Calendar,
  X,
  Target
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function GlobalLeaderboardPage() {
  const router = useRouter();
  const pathname = usePathname();

  const globalLeaderboard = useLeaderboardStore((s) => s.globalLeaderboard);
  const setGlobalLeaderboard = useLeaderboardStore((s) => s.setGlobalLeaderboard);
  const comparisonUserA = useLeaderboardStore((s) => s.comparisonUserA);
  const comparisonUserB = useLeaderboardStore((s) => s.comparisonUserB);
  const setComparisonUser = useLeaderboardStore((s) => s.setComparisonUser);

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showComparisonDialog, setShowComparisonDialog] = useState(false);
  const itemsPerPage = 8;

  // 1. WebSocket sync hook
  useLeaderboardWebSocket();

  // 2. Fetch Global Leaderboard
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await getGlobalLeaderboard();
        setGlobalLeaderboard(data);
      } catch (err) {
        toast.error("Failed to load global rankings.");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [setGlobalLeaderboard]);

  const filteredUsers = globalLeaderboard.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Top 3 Podium Roster
  const topThree = globalLeaderboard.slice(0, 3);

  const navLinks = [
    { href: "/leaderboard", label: "Global" },
    { href: "/leaderboard/categories", label: "Categories" },
    { href: "/leaderboard/seasons", label: "Seasons" },
    { href: "/leaderboard/competitions", label: "Competitions" },
    { href: "/leaderboard/hall-of-fame", label: "Hall of Fame" }
  ];

  const handleCompareClick = (user: LeaderboardUser) => {
    if (!comparisonUserA) {
      setComparisonUser("A", user);
      toast.success(`Selected ${user.name} for comparison. Choose another competitor.`);
    } else if (comparisonUserA.id === user.id) {
      toast.warning("User already selected in Slot A.");
    } else {
      setComparisonUser("B", user);
      setShowComparisonDialog(true);
    }
  };

  const clearComparisons = () => {
    setComparisonUser("A", null);
    setComparisonUser("B", null);
    setShowComparisonDialog(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <p className="text-sm text-zinc-500 font-semibold tracking-wide animate-pulse">
          Sizing leaderboard tables...
        </p>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto max-w-5xl space-y-8 relative z-10">
      
      {/* 1. Page Header Dashboard Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-900 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="h-4.5 w-4.5 text-purple-400" />
            <span className="text-[10px] font-extrabold uppercase text-purple-400 tracking-wider">
              Ecosystem Leaderboard
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent mt-1.5">
            Global Master Standings
          </h1>
          <p className="text-xs text-zinc-500 font-semibold mt-1">
            Browse top performing engineers, examine metrics, and verify elite rankings tiers.
          </p>
        </div>

        {/* Sync telemetry tag */}
        <div className="flex items-center gap-2 bg-zinc-950/60 border border-zinc-900 px-4 py-2.5 rounded-2xl text-[10px] font-extrabold text-zinc-400 uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>WebSocket Standings Synced</span>
        </div>
      </div>

      {/* 2. Leaderboard Sub-Navigation Tabs */}
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

      {/* 3. TOP PERFORMERS PODIUM CARDS */}
      <div className="grid gap-6 sm:grid-cols-3 pt-4">
        {topThree.map((user, index) => {
          const podiumColors = [
            { border: "border-yellow-500/30", text: "text-yellow-500", glow: "from-yellow-500/2" },
            { border: "border-cyan-500/30", text: "text-cyan-400", glow: "from-cyan-500/2" },
            { border: "border-purple-500/30", text: "text-purple-400", glow: "from-purple-500/2" }
          ][index];

          return (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onClick={() => router.push(`/leaderboard/users/${user.id}`)}
              className="cursor-pointer"
            >
              <Card className={`border-zinc-900 bg-zinc-950/40 relative overflow-hidden group hover:${podiumColors?.border || "border-zinc-800"} transition-all duration-300 text-center min-h-[220px] flex flex-col justify-between`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${podiumColors?.glow || "from-transparent"} via-transparent to-transparent pointer-events-none`} />
                
                <CardHeader className="pb-2 space-y-1.5">
                  <div className="flex justify-center mb-1">
                    <span className={`text-[10px] font-black uppercase px-3 py-0.5 rounded-full bg-zinc-900 border border-zinc-850 ${podiumColors?.text || "text-zinc-400"}`}>
                      Rank #{index + 1}
                    </span>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center text-xs font-bold text-white uppercase mx-auto border border-zinc-800 shadow-[0_0_15px_rgba(255,255,255,0.02)]">
                    {user.name.slice(0, 2)}
                  </div>
                  <CardTitle className="text-sm font-bold text-white tracking-wide mt-2">
                    {user.name}
                  </CardTitle>
                  <CardDescription className="text-[10px] text-zinc-500 font-semibold uppercase">
                    @{user.username}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pb-4 space-y-1">
                  <p className="text-xl font-black text-white">{user.score.toLocaleString()} XP</p>
                  <div className="flex justify-center gap-3.5 text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">
                    <span>Acc: {user.accuracy}%</span>
                    <span>Streak: {user.streak}d</span>
                  </div>
                </CardContent>

                <CardFooter className="pt-2 border-t border-zinc-900/50 bg-zinc-950/20 text-[9px] font-extrabold uppercase tracking-widest text-zinc-500 flex justify-center items-center gap-1">
                  <span>Elite profile room</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </CardFooter>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* 4. ACTIVE ROSTER TABLE & FILTER CONTROLS */}
      <div className="space-y-4">
        
        {/* Filters Panel bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500 pointer-events-none" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search global masters..."
              className="pl-10 bg-zinc-950/40 border-zinc-900 text-white placeholder-zinc-500 focus-visible:ring-purple-500 h-10 rounded-xl"
            />
          </div>

          {/* User slot compare banner indicators */}
          {comparisonUserA && (
            <div className="flex items-center gap-3 p-2 bg-purple-950/5 border border-purple-500/10 rounded-xl text-[10px] font-bold text-zinc-400">
              <span className="text-purple-400 uppercase tracking-wider pl-0.5">Slot A: {comparisonUserA.name}</span>
              <button onClick={clearComparisons} className="text-zinc-500 hover:text-zinc-300">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Global Standings Board */}
        <Card className="border-zinc-900 bg-zinc-950/40 backdrop-blur-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs font-bold text-zinc-400">
              <thead>
                <tr className="border-b border-zinc-900 text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 bg-zinc-950/40">
                  <th className="px-6 py-4.5 w-16">Rank</th>
                  <th className="px-6 py-4.5">Engineer</th>
                  <th className="px-6 py-4.5 text-center">Tiers</th>
                  <th className="px-6 py-4.5 text-right">XP Points</th>
                  <th className="px-6 py-4.5 text-center">Accuracy</th>
                  <th className="px-6 py-4.5 text-center">Streak</th>
                  <th className="px-6 py-4.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {paginatedUsers.map((user, index) => {
                    const globalRank = (currentPage - 1) * itemsPerPage + index + 1;
                    const isUser = user.id === "user_demo";

                    return (
                      <motion.tr
                        key={user.id}
                        layoutId={`row_${user.id}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`border-b border-zinc-900/60 hover:bg-zinc-900/10 transition-all ${
                          isUser ? "bg-purple-950/5 text-white" : ""
                        }`}
                      >
                        {/* Rank */}
                        <td className="px-6 py-4.5 font-mono text-[11px] font-extrabold text-zinc-500">
                          #{user.globalRank}
                        </td>

                        {/* Name plate */}
                        <td className="px-6 py-4.5">
                          <Link href={`/leaderboard/users/${user.id}`} className="hover:text-purple-400 transition-colors">
                            <div className="flex items-center gap-2.5">
                              <div className="h-6.5 w-6.5 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center text-[9px] font-bold text-white uppercase shrink-0">
                                {user.name.slice(0, 2)}
                              </div>
                              <div>
                                <p className="text-zinc-200 leading-none">{user.name}</p>
                                <p className="text-[9px] text-zinc-500 font-semibold mt-0.5">@{user.username}</p>
                              </div>
                            </div>
                          </Link>
                        </td>

                        {/* Tier Badge */}
                        <td className="px-6 py-4.5 text-center">
                          <Badge className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                            user.tier === "ELITE" 
                              ? "bg-purple-500/10 text-purple-400 border-purple-500/20" 
                              : "bg-zinc-900 text-zinc-400 border-zinc-800"
                          }`}>
                            {user.tier}
                          </Badge>
                        </td>

                        {/* Score */}
                        <td className="px-6 py-4.5 text-right font-black font-mono tracking-wide text-cyan-400">
                          {user.score.toLocaleString()} XP
                        </td>

                        {/* Accuracy */}
                        <td className="px-6 py-4.5 text-center font-mono">
                          {user.accuracy}%
                        </td>

                        {/* Streak */}
                        <td className="px-6 py-4.5 text-center font-mono text-zinc-500">
                          {user.streak} days
                        </td>

                        {/* Actions Compare */}
                        <td className="px-6 py-4.5 text-center">
                          <Button
                            onClick={() => handleCompareClick(user)}
                            variant="ghost"
                            className="h-7 border border-zinc-900 hover:border-purple-500/20 hover:bg-purple-500/10 text-[9px] font-extrabold uppercase tracking-widest text-zinc-500 hover:text-purple-400 px-2 rounded-lg"
                          >
                            <ArrowRightLeft className="h-3 w-3 mr-1" /> Compare
                          </Button>
                        </td>

                      </motion.tr>
                    );
                  })}
                </AnimatePresence>

                {paginatedUsers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-zinc-600 uppercase tracking-widest text-[10px]">
                      No engineers match search query
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-zinc-900 flex items-center justify-between">
              <Button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white font-extrabold h-9 text-[10px] uppercase rounded-lg disabled:opacity-30 disabled:pointer-events-none"
              >
                Previous
              </Button>

              <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white font-extrabold h-9 text-[10px] uppercase rounded-lg disabled:opacity-30 disabled:pointer-events-none"
              >
                Next
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* 5. USER COMPARISON DRAWER DIALOG MODAL */}
      <Dialog open={showComparisonDialog} onOpenChange={setShowComparisonDialog}>
        <DialogContent className="bg-zinc-950 border border-zinc-900 text-white max-w-lg rounded-2xl">
          <DialogHeader className="pb-3 border-b border-zinc-900/60">
            <DialogTitle className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-1.5 pl-0.5">
              <ArrowRightLeft className="h-4.5 w-4.5 text-purple-400 animate-pulse" />
              <span>Contestant Comparison Analytics</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 font-semibold mt-1">
              Side-by-side diagnostic metrics comparing core skill metrics and efficiency values.
            </DialogDescription>
          </DialogHeader>

          {comparisonUserA && comparisonUserB && (
            <div className="py-4 space-y-5">
              {/* Profile Headings */}
              <div className="grid grid-cols-2 text-center border-b border-zinc-900/30 pb-3">
                <div className="space-y-1 border-r border-zinc-900/30">
                  <p className="text-xs font-black text-white">{comparisonUserA.name}</p>
                  <span className="text-[9px] text-purple-400 font-extrabold uppercase">Rank #{comparisonUserA.globalRank}</span>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black text-white">{comparisonUserB.name}</p>
                  <span className="text-[9px] text-cyan-400 font-extrabold uppercase">Rank #{comparisonUserB.globalRank}</span>
                </div>
              </div>

              {/* Comparative bars */}
              <div className="space-y-4">
                {/* Score */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">
                    <span>{comparisonUserA.score.toLocaleString()} XP</span>
                    <span>Total Score XP</span>
                    <span>{comparisonUserB.score.toLocaleString()} XP</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-900 flex overflow-hidden">
                    <div 
                      className="bg-purple-500 h-full border-r border-black/40" 
                      style={{ width: `${(comparisonUserA.score / (comparisonUserA.score + comparisonUserB.score)) * 100}%` }} 
                    />
                    <div 
                      className="bg-cyan-400 h-full" 
                      style={{ width: `${(comparisonUserB.score / (comparisonUserA.score + comparisonUserB.score)) * 100}%` }} 
                    />
                  </div>
                </div>

                {/* Accuracy */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">
                    <span>{comparisonUserA.accuracy}%</span>
                    <span>Graded Accuracy</span>
                    <span>{comparisonUserB.accuracy}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-900 flex overflow-hidden">
                    <div 
                      className="bg-purple-500 h-full border-r border-black/40" 
                      style={{ width: `${(comparisonUserA.accuracy / (comparisonUserA.accuracy + comparisonUserB.accuracy)) * 100}%` }} 
                    />
                    <div 
                      className="bg-cyan-400 h-full" 
                      style={{ width: `${(comparisonUserB.accuracy / (comparisonUserA.accuracy + comparisonUserB.accuracy)) * 100}%` }} 
                    />
                  </div>
                </div>

                {/* Streaks */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">
                    <span>{comparisonUserA.streak} days</span>
                    <span>Active Streak</span>
                    <span>{comparisonUserB.streak} days</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-900 flex overflow-hidden">
                    <div 
                      className="bg-purple-500 h-full border-r border-black/40" 
                      style={{ width: `${(comparisonUserA.streak / (comparisonUserA.streak + comparisonUserB.streak)) * 100}%` }} 
                    />
                    <div 
                      className="bg-cyan-400 h-full" 
                      style={{ width: `${(comparisonUserB.streak / (comparisonUserA.streak + comparisonUserB.streak)) * 100}%` }} 
                    />
                  </div>
                </div>

                {/* Competition points */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">
                    <span>{comparisonUserA.competitionPoints.toLocaleString()}</span>
                    <span>Competition Points</span>
                    <span>{comparisonUserB.competitionPoints.toLocaleString()}</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-900 flex overflow-hidden">
                    <div 
                      className="bg-purple-500 h-full border-r border-black/40" 
                      style={{ width: `${(comparisonUserA.competitionPoints / (comparisonUserA.competitionPoints + comparisonUserB.competitionPoints)) * 100}%` }} 
                    />
                    <div 
                      className="bg-cyan-400 h-full" 
                      style={{ width: `${(comparisonUserB.competitionPoints / (comparisonUserA.competitionPoints + comparisonUserB.competitionPoints)) * 100}%` }} 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-zinc-900/60 flex justify-end">
            <Button
              onClick={clearComparisons}
              className="bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white font-extrabold h-10 px-5 rounded-xl text-xs uppercase"
            >
              Clear Comparison
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}