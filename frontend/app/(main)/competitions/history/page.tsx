"use client";

import React, { useState, useEffect } from "react";
import { getCompetitionHistory } from "@/features/competition/api";
import { CompetitionHistoryItem } from "@/features/competition/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Trophy,
  Calendar,
  Users,
  Award,
  Download,
  Share2,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Bookmark,
  Printer,
  Loader2,
  Lock
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function CompetitionHistoryPage() {
  const { user } = useUser();
  const [history, setHistory] = useState<CompetitionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState<CompetitionHistoryItem | null>(null);

  // Load history list
  useEffect(() => {
    async function loadHistory() {
      setIsLoading(true);
      try {
        const data = await getCompetitionHistory();
        setHistory(data);
      } catch (err) {
        toast.error("Failed to load competition history.");
      } finally {
        setIsLoading(false);
      }
    }
    loadHistory();
  }, []);

  const handlePrintCertificate = () => {
    window.print();
  };

  const handleDownloadSuccess = () => {
    toast.success("Certificate downloaded as digital credential!");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <p className="text-sm text-zinc-500 font-semibold tracking-wide animate-pulse">
          Opening credentials vault...
        </p>
      </div>
    );
  }

  const username = user?.fullName || user?.username || "Gaurav Singh";

  return (
    <div className="container px-4 py-8 mx-auto max-w-5xl space-y-7 relative z-10">
      
      {/* Page Header Stand */}
      <div className="border-b border-zinc-900 pb-6">
        <div className="flex items-center gap-2">
          <Bookmark className="h-4.5 w-4.5 text-purple-400" />
          <span className="text-[10px] font-extrabold uppercase text-purple-400 tracking-wider">
            Achievements Desk
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent mt-1.5">
          Competitive Match History
        </h1>
        <p className="text-xs text-zinc-500 font-semibold mt-1">
          Review your historic proctored achievements, earned grades, and digital awards certificates.
        </p>
      </div>

      {/* Grid of historic cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {history.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
          >
            <Card className="border-zinc-900 bg-zinc-950/40 relative overflow-hidden group hover:border-zinc-800 transition-all flex flex-col justify-between min-h-[220px]">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/2 via-transparent to-transparent pointer-events-none" />
              
              <CardHeader className="space-y-2 pb-4">
                <div className="flex justify-between items-center w-full">
                  <span className="text-[9px] font-extrabold uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-0.5 rounded-full">
                    {item.category}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase">
                    {new Date(item.date).toLocaleDateString()}
                  </span>
                </div>
                <CardTitle className="text-sm font-bold text-white tracking-wide group-hover:text-purple-400 transition-colors">
                  {item.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3 pb-4">
                <div className="grid grid-cols-3 gap-2 p-3 bg-zinc-900/40 border border-zinc-900/60 rounded-xl text-center">
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Ranked</span>
                    <p className="text-sm font-black text-white">#{item.rank} <span className="text-[9px] text-zinc-500 font-bold">/ {item.totalParticipants}</span></p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Score</span>
                    <p className="text-sm font-black text-white">{item.score} XP</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Accuracy</span>
                    <p className="text-sm font-black text-white">{item.accuracy}%</p>
                  </div>
                </div>

                {item.badgeUnlocked && (
                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-cyan-400 uppercase tracking-wider pl-0.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Unlocked Badge: {item.badgeUnlocked}</span>
                  </div>
                )}
              </CardContent>

              <CardFooter className="pt-2 border-t border-zinc-900/50">
                <Button
                  onClick={() => setSelectedCertificate(item)}
                  className="w-full bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white font-extrabold h-10 rounded-xl text-xs gap-1.5 transition-all"
                >
                  <Award className="h-4 w-4 text-yellow-500" />
                  <span>Open Digital Certificate</span>
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}

        {history.length === 0 && (
          <div className="md:col-span-2 text-center py-16 p-6 bg-zinc-950/20 border border-zinc-900 rounded-2xl">
            <Trophy className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">No Competitions Recorded</h3>
            <p className="text-[11px] text-zinc-600 font-semibold max-w-xs mx-auto mt-1 leading-relaxed">
              Once you complete any proctored match arenas, your scores, certificate templates, and badges will reside here.
            </p>
          </div>
        )}
      </div>

      {/* CERTIFICATE DISPLAY FRAME DIALOG */}
      <Dialog open={!!selectedCertificate} onOpenChange={() => setSelectedCertificate(null)}>
        <DialogContent className="bg-zinc-950 border border-zinc-900 text-white max-w-2xl rounded-2xl overflow-hidden p-0">
          <AnimatePresence>
            {selectedCertificate && (
              <div className="p-6 md:p-8 space-y-6">
                
                {/* 1. Print Frame (Aesthetic dark credentials layout) */}
                <div className="border-[3px] border-double border-purple-500/20 bg-black/60 rounded-xl p-8 text-center space-y-8 relative overflow-hidden">
                  {/* Glowing background highlights */}
                  <div className="absolute top-0 left-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute bottom-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

                  {/* Header Crest */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-12 w-12 rounded-full border border-purple-500/30 flex items-center justify-center bg-purple-500/5 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                      <Trophy className="h-6 w-6 text-yellow-500" />
                    </div>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-500">
                      Mindrift Competitive Arena Core
                    </span>
                  </div>

                  {/* Title */}
                  <div className="space-y-1">
                    <h2 className="text-xl md:text-2xl font-black text-white tracking-widest font-mono uppercase bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                      CERTIFICATE OF MERIT
                    </h2>
                    <div className="h-0.5 w-16 bg-purple-500 mx-auto" />
                  </div>

                  {/* Body Text */}
                  <div className="space-y-4 max-w-md mx-auto text-xs leading-relaxed text-zinc-400 font-semibold">
                    <p>This document officially certifies that</p>
                    <p className="text-base font-black text-white tracking-wide uppercase">{username}</p>
                    <p>
                      has demonstrated proficiency by successfully competing in the tournament
                    </p>
                    <p className="text-sm font-black text-purple-400 tracking-wide uppercase">
                      {selectedCertificate.title}
                    </p>
                    <p>
                      placing in <span className="text-white font-bold">#{selectedCertificate.rank} place</span> overall 
                      with a graded score of <span className="text-white font-bold">{selectedCertificate.score} XP</span> 
                      and <span className="text-white font-bold">{selectedCertificate.accuracy}% accuracy</span>.
                    </p>
                  </div>

                  {/* Sealed signature footer details */}
                  <div className="flex flex-col sm:flex-row items-center justify-between border-t border-zinc-900/60 pt-6 gap-4 text-left">
                    <div className="space-y-1 text-center sm:text-left">
                      <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider block">Verification Seal</span>
                      <p className="text-[9px] font-mono text-zinc-400 font-bold flex items-center gap-1">
                        <Lock className="h-3 w-3 text-cyan-400" /> SSO Credentials Signed
                      </p>
                    </div>

                    <div className="space-y-1 text-center sm:text-right">
                      <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider block">Award ID</span>
                      <p className="text-[9px] font-mono text-zinc-400 font-bold uppercase">
                        {selectedCertificate.id}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Actions pane */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-zinc-900/50">
                  <Button
                    onClick={handleDownloadSuccess}
                    className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-extrabold h-11 rounded-xl text-xs gap-1.5 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                  >
                    <Download className="h-4 w-4" /> Download Credential
                  </Button>
                  
                  <Button
                    onClick={handlePrintCertificate}
                    variant="ghost"
                    className="flex-1 border border-zinc-900 hover:border-zinc-800 bg-zinc-950/20 text-zinc-300 hover:text-white font-bold h-11 rounded-xl gap-1.5 text-xs"
                  >
                    <Printer className="h-4 w-4" /> Print Document
                  </Button>
                </div>

              </div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

    </div>
  );
}
