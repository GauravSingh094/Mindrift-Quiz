"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCompetitionStore } from "@/features/competition/store/competition-store";
import { joinCompetitionLobby } from "@/features/competition/api";
import { CompetitionWebSocketService } from "@/features/competition/websocket/competition-websocket";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Users,
  Clock,
  ArrowRight,
  Shield,
  Volume2,
  Megaphone,
  Radio,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Play
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function CompetitionLobbyPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useUser();
  
  const lobby = useCompetitionStore((s) => s.lobby);
  const announcements = useCompetitionStore((s) => s.announcements);
  const socketConnected = useCompetitionStore((s) => s.socketConnected);
  const setLobby = useCompetitionStore((s) => s.setLobby);
  const clearStore = useCompetitionStore((s) => s.clearStore);

  const [isLoading, setIsLoading] = useState(true);
  const [userReady, setUserReady] = useState(false);
  const [secondsToStart, setSecondsToStart] = useState(60);

  // Initialize lobby details
  useEffect(() => {
    async function loadLobby() {
      setIsLoading(true);
      try {
        const data = await joinCompetitionLobby(id as string);
        setLobby(data);
        
        // Setup WS Presence
        const username = user?.fullName || user?.username || "Arthur Dent";
        const userId = user?.id || "user_demo";
        CompetitionWebSocketService.connect(id as string, userId, username);
      } catch (err) {
        toast.error("Failed to sync with live match lobby.");
      } finally {
        setIsLoading(false);
      }
    }
    if (id) loadLobby();

    return () => {
      CompetitionWebSocketService.disconnect();
      clearStore();
    };
  }, [id, setLobby, clearStore, user]);

  // Countdown timer to start simulation
  useEffect(() => {
    if (!lobby) return;
    
    // Simulate dynamic seconds countdown
    const interval = setInterval(() => {
      setSecondsToStart((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [lobby]);

  const handleToggleReady = () => {
    setUserReady(!userReady);
    toast.success(!userReady ? "You are marked as READY!" : "Cancelled ready status.");
  };

  const handleStartMatch = () => {
    if (!userReady) {
      toast.warning("Please toggle your readiness state to begin the contest.");
      return;
    }
    router.push(`/competitions/${id}/live`);
  };

  if (isLoading || !lobby) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <p className="text-sm text-zinc-500 font-semibold tracking-wide animate-pulse">
          Connecting to real-time proctor servers...
        </p>
      </div>
    );
  }

  // Format ticking countdown
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="container px-4 py-8 mx-auto max-w-5xl space-y-8 relative z-10">
      
      {/* Lobby Header Stand */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-zinc-900 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-purple-500 animate-ping" />
            <span className="text-[10px] font-extrabold uppercase text-purple-400 tracking-wider">
              Real-Time Match Lounge
            </span>
            <Badge className="bg-zinc-900 text-zinc-400 border border-zinc-800 text-[9px] font-bold px-2 rounded-full uppercase">
              {socketConnected ? "Connected" : "Offline"}
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent mt-2">
            {lobby.title}
          </h1>
          <p className="text-xs text-zinc-500 font-semibold mt-1">
            Arena is buffering. Wait for all contestants to confirm ready before lock-in.
          </p>
        </div>

        {/* Countdown Board */}
        <div className="bg-zinc-950/60 border border-zinc-900 px-5 py-3 rounded-2xl flex flex-col items-center min-w-[140px]">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Start Countdown</span>
          <span className="text-2xl font-black text-cyan-400 font-mono tracking-wider mt-0.5">
            {secondsToStart > 0 ? formatTime(secondsToStart) : "MATCH READY"}
          </span>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Left Columns (2/3): Announcements and participants roster */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Announcements Feed */}
          <div className="space-y-3.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2 pl-0.5">
              <Megaphone className="h-4 w-4 text-purple-400" />
              <span>Live Announcement Broadcaster</span>
            </h2>
            <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-4 max-h-[160px] overflow-y-auto space-y-2.5">
              <AnimatePresence>
                {announcements.map((ann, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-2.5 items-start text-xs leading-relaxed font-semibold text-zinc-400"
                  >
                    <Volume2 className="h-4 w-4 text-cyan-500 shrink-0 mt-0.5" />
                    <p>{ann}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Roster list */}
          <div className="space-y-3.5">
            <div className="flex justify-between items-center pl-0.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-400" />
                <span>Connected Contestants ({lobby.participants.length})</span>
              </h2>
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Capacity: {lobby.maxParticipants} max</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {lobby.participants.map((participant) => (
                <div
                  key={participant.userId}
                  className="flex items-center justify-between p-3.5 bg-zinc-950/40 border border-zinc-900 rounded-xl"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-[10px] text-white font-bold uppercase">
                      {participant.name.slice(0, 2)}
                    </div>
                    <span className="text-xs font-bold text-white leading-none">
                      {participant.name}
                    </span>
                  </div>

                  <Badge className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                    participant.ready 
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" 
                      : "bg-zinc-900 text-zinc-500 border border-zinc-800"
                  }`}>
                    {participant.ready ? "Ready" : "Waiting"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1/3): Ready lock actions */}
        <div className="space-y-6">
          <Card className="border-zinc-900 bg-zinc-950/40 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/2 via-transparent to-transparent pointer-events-none" />
            
            <CardHeader className="space-y-2 pb-4">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                Gate Lock Control
              </CardTitle>
              <CardDescription className="text-[11px] font-semibold text-zinc-500 leading-normal">
                Toggle your readiness state to signal availability to the match lobby. All players must register READY before entry is allowed.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pb-4 border-t border-zinc-900/50 pt-4">
              {/* Requirement ticks */}
              <div className="space-y-3 text-xs font-bold text-zinc-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4.5 w-4.5 text-cyan-400 shrink-0" />
                  <span>Proctor Engine: Initialized</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4.5 w-4.5 text-cyan-400 shrink-0" />
                  <span>Sub-second Clock: Synced</span>
                </div>
                <div className="flex items-center gap-2">
                  {userReady ? (
                    <CheckCircle2 className="h-4.5 w-4.5 text-cyan-400 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4.5 w-4.5 text-purple-400 shrink-0 animate-pulse" />
                  )}
                  <span className={userReady ? "text-white" : "text-zinc-500 font-semibold"}>
                    {userReady ? "Lobby State: Ready" : "Lobby State: Unconfirmed"}
                  </span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-2 pt-2 border-t border-zinc-900/50">
              <Button
                onClick={handleToggleReady}
                className={`w-full font-extrabold h-11 rounded-xl text-xs transition-all ${
                  userReady
                    ? "bg-cyan-500 hover:bg-cyan-600 text-black shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                    : "bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-300"
                }`}
              >
                {userReady ? "✓ Marked as Ready" : "Mark Myself Ready"}
              </Button>

              <Button
                onClick={handleStartMatch}
                disabled={!userReady}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white font-extrabold h-11 rounded-xl gap-2 text-xs transition-all disabled:opacity-50 disabled:pointer-events-none shadow-[0_0_20px_rgba(168,85,247,0.15)]"
              >
                <span>Enter Arena Console</span>
                <Play className="h-3.5 w-3.5 fill-current" />
              </Button>
            </CardFooter>
          </Card>
        </div>

      </div>
    </div>
  );
}
