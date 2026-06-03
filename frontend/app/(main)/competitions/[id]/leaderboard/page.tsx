"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCompetitionLeaderboard, getCompetitionById } from "@/features/competition/api";
import { CompetitionParticipant } from "@/features/competition/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Users,
  Clock,
  ArrowLeft,
  Search,
  ChevronLeft,
  ChevronRight,
  Wifi,
  Sparkles,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function CompetitionLeaderboardPage() {
  const { id } = useParams();
  const router = useRouter();

  const [leaderboard, setLeaderboard] = useState<CompetitionParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 1. Fetch live leaderboard data
  useEffect(() => {
    async function loadLeaderboard() {
      setIsLoading(true);
      try {
        const data = await getCompetitionLeaderboard(id as string);
        setLeaderboard(data);
      } catch (err) {
        toast.error("Failed to load competitive standings.");
      } finally {
        setIsLoading(false);
      }
    }
    if (id) loadLeaderboard();

    // Emulate live updates every 5 seconds to simulate other participants finishing!
    const interval = setInterval(async () => {
      try {
        const data = await getCompetitionLeaderboard(id as string);
        setLeaderboard(data);
      } catch (_) {}
    }, 5000);

    return () => clearInterval(interval);
  }, [id]);

  // 2. Filter & Paginate
  const filteredList = leaderboard.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  const paginatedList = filteredList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatSeconds = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}m ${secs.toString().padStart(2, "0")}s`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <p className="text-sm text-zinc-500 font-semibold tracking-wide animate-pulse">
          Compiling scoreboard arrays...
        </p>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto max-w-5xl space-y-7 relative z-10">
      
      {/* Back to detail button */}
      <Button 
        onClick={() => router.push(`/competitions/${id}`)}
        variant="ghost" 
        className="text-zinc-500 hover:text-zinc-300 text-xs font-extrabold uppercase tracking-wider p-0 bg-transparent hover:bg-transparent"
      >
        ← Back to Details
      </Button>

      {/* Title Header Stand */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-zinc-900 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="h-4.5 w-4.5 text-purple-400" />
            <span className="text-[10px] font-extrabold uppercase text-purple-400 tracking-wider">
              Graded Board Standings
            </span>
            <div className="flex items-center gap-1 pl-1">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[9px] text-zinc-500 font-bold uppercase">Dynamic WS updates active</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent mt-1.5">
            Docker Orchestration Leaderboard
          </h1>
          <p className="text-xs text-zinc-500 font-semibold mt-1">
            Global contestant positions, accuracy grades, and total submission velocities.
          </p>
        </div>
      </div>

      {/* Grid Table Row Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500 pointer-events-none" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search contestants..."
            className="pl-10 bg-zinc-950/40 border-zinc-900 text-white placeholder-zinc-500 focus-visible:ring-purple-500 h-10 rounded-xl"
          />
        </div>

        {/* Global info metrics */}
        <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider pl-0.5">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-purple-400" />
            <span>{leaderboard.length} Participated</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-cyan-400" />
            <span>30m Speed Limit</span>
          </div>
        </div>
      </div>

      {/* Standboard Score Roster Panel */}
      <Card className="border-zinc-900 bg-zinc-950/40 backdrop-blur-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs font-bold text-zinc-400">
            <thead>
              <tr className="border-b border-zinc-900 text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 bg-zinc-950/40">
                <th className="px-6 py-4.5 w-16">Rank</th>
                <th className="px-6 py-4.5">Contestant Name</th>
                <th className="px-6 py-4.5 text-right">Points score</th>
                <th className="px-6 py-4.5 text-center">Correctness</th>
                <th className="px-6 py-4.5 text-right">Velocity</th>
                <th className="px-6 py-4.5 text-center">Telemetry</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {paginatedList.map((participant, index) => {
                  const globalRank = (currentPage - 1) * itemsPerPage + index + 1;
                  const isUser = participant.userId === "user_demo" || participant.name.includes("You");
                  
                  return (
                    <motion.tr
                      key={participant.userId}
                      layoutId={`row_${participant.userId}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      className={`border-b border-zinc-900/60 hover:bg-zinc-900/20 transition-all ${
                        isUser ? "bg-purple-950/5 text-white" : ""
                      }`}
                    >
                      {/* Rank Stand */}
                      <td className="px-6 py-4.5 text-[11px] font-extrabold">
                        {globalRank === 1 ? (
                          <span className="flex items-center justify-center h-6 w-6 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                            ★
                          </span>
                        ) : globalRank === 2 ? (
                          <span className="flex items-center justify-center h-6 w-6 rounded-full bg-zinc-300/10 text-zinc-300 border border-zinc-300/20">
                            2
                          </span>
                        ) : globalRank === 3 ? (
                          <span className="flex items-center justify-center h-6 w-6 rounded-full bg-amber-700/10 text-amber-600 border border-amber-700/20">
                            3
                          </span>
                        ) : (
                          <span className="text-zinc-500 pl-2">#{globalRank}</span>
                        )}
                      </td>

                      {/* Name Plate */}
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center text-[9px] font-bold text-white uppercase">
                            {participant.name.slice(0, 2)}
                          </div>
                          <span className="text-zinc-200">
                            {participant.name} {isUser && <span className="text-purple-400 text-[10px] ml-1">(You)</span>}
                          </span>
                        </div>
                      </td>

                      {/* Points score */}
                      <td className="px-6 py-4.5 text-right font-black font-mono tracking-wide text-cyan-400">
                        {participant.score} XP
                      </td>

                      {/* Graded Accuracy */}
                      <td className="px-6 py-4.5 text-center font-mono">
                        <Badge className="bg-zinc-900 text-zinc-400 border border-zinc-800 text-[9px] font-bold">
                          {participant.questionsAnswered} Answered
                        </Badge>
                      </td>

                      {/* Submission Speed Velocity */}
                      <td className="px-6 py-4.5 text-right font-mono text-zinc-500">
                        {formatSeconds(participant.timeSpentSeconds)}
                      </td>

                      {/* Online Status Check */}
                      <td className="px-6 py-4.5 text-center">
                        <span className={`inline-block h-2 w-2 rounded-full ${
                          participant.isActive ? "bg-cyan-400 animate-pulse" : "bg-zinc-800"
                        }`} />
                      </td>

                    </motion.tr>
                  );
                })}
              </AnimatePresence>

              {paginatedList.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-600 uppercase tracking-widest text-[10px]">
                    No contestants match search
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Console controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-zinc-900 flex items-center justify-between">
            <Button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white font-extrabold h-9 text-[10px] uppercase rounded-lg disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>

            <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white font-extrabold h-9 text-[10px] uppercase rounded-lg disabled:opacity-30 disabled:pointer-events-none"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
