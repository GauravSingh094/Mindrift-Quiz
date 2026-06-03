"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCompetitionStore } from "@/features/competition/store/competition-store";
import { useCompetitionProctoring, useCompetitionTimer } from "@/features/competition/hooks/use-competition";
import { CompetitionWebSocketService } from "@/features/competition/websocket/competition-websocket";
import { getCompetitionById } from "@/features/competition/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  Trophy,
  Users,
  Clock,
  ArrowRight,
  Shield,
  ShieldAlert,
  Flag,
  CheckCircle,
  Play,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Lock,
  Wifi
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// Fallback questions in case the fetched tournament has no questions
const fallbackQuestions = [
  {
    id: "dq_1",
    questionText: "Which Docker compose parameter specifies the startup dependency sequence of services?",
    points: 100,
    timeLimitSeconds: 90,
    options: [
      { id: "do_1", optionText: "depends_on" },
      { id: "do_2", optionText: "links" },
      { id: "do_3", optionText: "networks" },
      { id: "do_4", optionText: "volumes" }
    ]
  },
  {
    id: "dq_2",
    questionText: "What Kafka broker parameter manages the data retention duration limit?",
    points: 100,
    timeLimitSeconds: 90,
    options: [
      { id: "do_5", optionText: "log.retention.hours" },
      { id: "do_6", optionText: "log.segment.bytes" },
      { id: "do_7", optionText: "offsets.topic.replication.factor" },
      { id: "do_8", optionText: "zookeeper.connect" }
    ]
  },
  {
    id: "dq_3",
    questionText: "Which command starts a swarm service with three running tasks concurrently?",
    points: 100,
    timeLimitSeconds: 90,
    options: [
      { id: "do_9", optionText: "docker service create --replicas 3" },
      { id: "do_10", optionText: "docker swarm init --nodes=3" },
      { id: "do_11", optionText: "docker run -d --replicas=3" },
      { id: "do_12", optionText: "docker service update --nodes=3" }
    ]
  },
  {
    id: "dq_4",
    questionText: "Which Docker isolation runtime configuration provides container sandbox isolation?",
    points: 120,
    timeLimitSeconds: 120,
    options: [
      { id: "do_13", optionText: "gVisor (runsc)" },
      { id: "do_14", optionText: "Cgroups V2" },
      { id: "do_15", optionText: "User Namespaces" },
      { id: "do_16", optionText: "AppArmor Profiles" }
    ]
  },
  {
    id: "dq_5",
    questionText: "What strategy allows Prometheus scraper targets to discover zero-downtime microservice addresses?",
    points: 150,
    timeLimitSeconds: 120,
    options: [
      { id: "do_17", optionText: "Consul Service Discovery" },
      { id: "do_18", optionText: "Reverse Proxy routes" },
      { id: "do_19", optionText: "Static IP routing tables" },
      { id: "do_20", optionText: "Round-robin DNS resolvers" }
    ]
  }
];

export default function CompetitionLivePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useUser();

  const store = useCompetitionStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // 1. Proctoring Hooks & Timers
  useCompetitionProctoring(store.status === "LIVE");
  useCompetitionTimer();

  // 2. Fetch and Initialize Exam attempt
  useEffect(() => {
    async function initArena() {
      setIsLoading(true);
      try {
        const data = await getCompetitionById(id as string);
        const questionsList = (data.questions && data.questions.length > 0) 
          ? data.questions 
          : fallbackQuestions;
          
        store.startAttempt({
          attemptId: `attempt_${Math.floor(Math.random() * 100000)}`,
          quizId: id as string,
          questions: questionsList,
          timeLimitSeconds: 300 // 5 minutes Speedrun limit
        });

        // Sync presence websocket
        const username = user?.fullName || user?.username || "Arthur Dent";
        const userId = user?.id || "user_demo";
        CompetitionWebSocketService.connect(id as string, userId, username);

        // Force user to go fullscreen
        try {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
            setIsFullscreen(true);
          }
        } catch (_) {
          console.warn("Fullscreen permission rejected by user or browser.");
        }
      } catch (err) {
        toast.error("Failed to compile proctored questions.");
      } finally {
        setIsLoading(false);
      }
    }
    if (id) initArena();

    return () => {
      // Graceful cleanups
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [id, user]);

  // Handle Early Submit
  const handleSubmitConfirmation = () => {
    store.completeAttempt();
    
    // Broadcast submit score via WS
    const answeredCount = Object.keys(store.answers).length;
    const finalScore = answeredCount * 100; // rough grading scale
    CompetitionWebSocketService.sendScoreUpdate(
      "user_demo",
      finalScore,
      answeredCount,
      300 - store.timeRemainingSeconds
    );

    toast.success("Competition submitted successfully!");
    router.push(`/competitions/${id}/results`);
  };

  const requestFullscreenMode = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
        toast.success("Proctored Fullscreen Restored.");
      }
    } catch (_) {
      toast.error("Failed to launch fullscreen. Please allow permissions.");
    }
  };

  if (isLoading || store.questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <p className="text-sm text-zinc-500 font-semibold tracking-wide animate-pulse">
          Configuring container sandboxes...
        </p>
      </div>
    );
  }

  const currentQuestion = store.questions[store.currentQuestionIndex];
  const totalQuestions = store.questions.length;
  const answeredCount = Object.keys(store.answers).length;

  const formatSeconds = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-black text-white relative flex flex-col overflow-hidden">
      
      {/* 1. Header Navigation and Stats Bar */}
      <header className="border-b border-zinc-900 bg-zinc-950/40 backdrop-blur-xl px-6 py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 relative z-20">
        <div className="flex items-center gap-3">
          <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-0.5 text-[9px] uppercase font-bold animate-pulse">
            Active Match
          </Badge>
          <h1 className="text-sm font-black tracking-wider text-zinc-200">
            DOCKER ARENA CHALLENGE
          </h1>
        </div>

        {/* Dynamic Countdown and submit triggers */}
        <div className="flex items-center justify-between sm:justify-end gap-5">
          
          {/* Synchronized timer */}
          <div className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-850 px-3.5 py-1.5 rounded-xl font-mono text-xs font-black text-cyan-400">
            <Clock className="h-3.5 w-3.5 text-cyan-400 animate-spin" />
            <span>{formatSeconds(store.timeRemainingSeconds)}</span>
          </div>

          {/* Early Submit button */}
          <Button
            onClick={() => setShowSubmitModal(true)}
            className="bg-purple-500 hover:bg-purple-600 text-white font-extrabold h-9 rounded-lg text-[10px] px-3.5 uppercase tracking-wider transition-all"
          >
            Submit Early
          </Button>
        </div>
      </header>

      {/* Main proctor lock block alert overlay */}
      {!isFullscreen && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center">
          <ShieldAlert className="h-16 w-16 text-purple-500 mb-4 animate-bounce" />
          <h2 className="text-xl font-black text-white tracking-wide">PROCTOR SHIELD INTERRUPTED</h2>
          <p className="text-xs text-zinc-500 max-w-sm font-semibold leading-relaxed mt-2 mb-6">
            Mindrift security requires proctored fullscreen view to validate integrity coefficients. Restore focus to continue the match.
          </p>
          <Button
            onClick={requestFullscreenMode}
            className="bg-cyan-500 hover:bg-cyan-600 text-black font-extrabold px-6 h-11 rounded-xl text-xs gap-1.5 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
          >
            <Lock className="h-4 w-4" /> Restore Fullscreen Proctoring
          </Button>
        </div>
      )}

      {/* 2. Flagship Dual Grid Workspace */}
      <div className="flex-1 grid gap-6 md:grid-cols-4 p-6 relative z-10">
        
        {/* Left Columns (3/4): Console Workspace */}
        <div className="md:col-span-3 flex flex-col justify-between space-y-6">
          
          {/* Question View Box */}
          <Card className="border-zinc-900 bg-zinc-950/20 backdrop-blur-xl relative flex-1 flex flex-col justify-between">
            <CardHeader className="pb-4 border-b border-zinc-900/50">
              <div className="flex justify-between items-center w-full">
                <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest pl-0.5">
                  Question {store.currentQuestionIndex + 1} of {totalQuestions}
                </span>
                <div className="flex items-center gap-1.5">
                  <Badge className="bg-zinc-900 border border-zinc-800 text-zinc-400 text-[8px] font-bold">
                    {currentQuestion.points} XP
                  </Badge>
                  <button
                    onClick={() => store.toggleFlag(currentQuestion.id)}
                    className={`p-1.5 rounded-lg border transition-all ${
                      store.flags[currentQuestion.id]
                        ? "bg-purple-500/10 border-purple-500/30 text-purple-400"
                        : "bg-zinc-950/50 border-zinc-900 text-zinc-500 hover:text-zinc-300"
                    }`}
                    title="Flag for review"
                  >
                    <Flag className="h-3.5 w-3.5 fill-current" />
                  </button>
                </div>
              </div>
              <CardTitle className="text-sm font-bold text-white leading-relaxed tracking-wide mt-4">
                {currentQuestion.questionText}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3.5 py-6">
              {currentQuestion.options.map((opt: any) => {
                const isSelected = store.answers[currentQuestion.id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => store.answerQuestion(currentQuestion.id, opt.id)}
                    className={`w-full flex items-start text-left gap-3.5 p-4 rounded-2xl border transition-all duration-300 ${
                      isSelected
                        ? "bg-purple-500/5 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.05)]"
                        : "bg-zinc-950/40 border-zinc-900 text-zinc-400 hover:border-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    <div className={`h-4.5 w-4.5 rounded-full border shrink-0 mt-0.5 flex items-center justify-center text-[9px] font-bold ${
                      isSelected ? "border-purple-400 text-purple-400 bg-purple-500/10" : "border-zinc-800 text-zinc-600"
                    }`}>
                      {isSelected ? "✓" : ""}
                    </div>
                    <span className="text-xs font-bold leading-normal">{opt.optionText}</span>
                  </button>
                );
              })}
            </CardContent>

            <CardFooter className="flex justify-between items-center py-4 border-t border-zinc-900/50 bg-zinc-950/20">
              <Button
                onClick={store.prevQuestion}
                disabled={store.currentQuestionIndex === 0}
                className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white font-extrabold h-9 text-[10px] uppercase rounded-lg disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              
              <Button
                onClick={store.nextQuestion}
                disabled={store.currentQuestionIndex === totalQuestions - 1}
                className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white font-extrabold h-9 text-[10px] uppercase rounded-lg disabled:opacity-30 disabled:pointer-events-none"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>

          {/* Dynamic Progress Console grid mapping */}
          <div className="p-4 bg-zinc-950/30 border border-zinc-900/60 rounded-2xl">
            <p className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest pl-0.5 mb-3.5">
              Arena Navigation Matrix
            </p>
            <div className="flex flex-wrap gap-2.5">
              {store.questions.map((q, index) => {
                const answered = !!store.answers[q.id];
                const flagged = !!store.flags[q.id];
                const active = store.currentQuestionIndex === index;
                
                let btnStyle = "bg-zinc-950/40 border-zinc-900 text-zinc-500 hover:border-zinc-800";
                if (answered) btnStyle = "bg-cyan-500/10 border-cyan-500/30 text-cyan-400";
                if (flagged) btnStyle = "bg-purple-500/10 border-purple-500/30 text-purple-400";
                if (active) btnStyle = "ring-1.5 ring-purple-500 border-transparent text-white font-black";

                return (
                  <button
                    key={q.id}
                    onClick={() => store.jumpToQuestion(index)}
                    className={`h-9 w-9 text-xs font-bold rounded-lg border transition-all ${btnStyle}`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (1/4): Standing board & Proctors stats */}
        <div className="space-y-6 flex flex-col">
          
          {/* Live scoreboard previews */}
          <Card className="border-zinc-900 bg-zinc-950/20 backdrop-blur-xl relative overflow-hidden flex-1 flex flex-col justify-between">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/2 via-transparent to-transparent pointer-events-none" />
            
            <CardHeader className="pb-3 border-b border-zinc-900/50">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 pl-0.5">
                <Trophy className="h-4 w-4 text-purple-400" />
                <span>Live Arena Standing</span>
              </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto py-4 space-y-3">
              {store.leaderboard.slice(0, 5).map((p, idx) => {
                const isUser = p.userId === "user_demo";
                return (
                  <div
                    key={p.userId}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      isUser
                        ? "bg-purple-500/5 border-purple-500/20 text-white"
                        : "bg-zinc-950/20 border-zinc-900 text-zinc-400"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold text-zinc-600 w-4">
                        #{idx + 1}
                      </span>
                      <div className="h-6 w-6 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center text-[9px] font-bold text-white uppercase shrink-0">
                        {p.name.slice(0, 2)}
                      </div>
                      <span className="text-xs font-bold truncate max-w-[100px] leading-none">
                        {p.name}
                      </span>
                    </div>

                    <span className="text-xs font-black font-mono tracking-wide text-zinc-300">
                      {p.score} XP
                    </span>
                  </div>
                );
              })}
            </CardContent>

            <CardFooter className="pt-2 border-t border-zinc-900/50">
              <div className="flex items-center justify-between w-full text-[10px] text-zinc-500 font-bold uppercase pl-0.5">
                <span>Roster: {store.leaderboard.length} online</span>
                <div className="flex items-center gap-1">
                  <Wifi className="h-3 w-3 text-cyan-400 animate-pulse" />
                  <span>Syncing Live</span>
                </div>
              </div>
            </CardFooter>
          </Card>

          {/* Proctoring telemetry box */}
          <div className="p-4 bg-zinc-950/30 border border-zinc-900/60 rounded-2xl space-y-3.5">
            <p className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest pl-0.5">
              Proctor Telemetry Logs
            </p>
            <div className="space-y-2 text-xs font-bold">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Session Status</span>
                <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[8px] font-bold rounded-full">
                  Secure Mode
                </Badge>
              </div>
              <div className="flex justify-between items-center border-t border-zinc-900/30 pt-2">
                <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Tab Switches</span>
                <span className={store.tabSwitchesCount > 0 ? "text-purple-400 font-black animate-pulse" : "text-zinc-400 font-black"}>
                  {store.tabSwitchesCount} flags
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-zinc-900/30 pt-2">
                <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Clipboard Flags</span>
                <span className={store.copyPasteAttemptsCount > 0 ? "text-purple-400 font-black animate-pulse" : "text-zinc-400 font-black"}>
                  {store.copyPasteAttemptsCount} flags
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-zinc-900/30 pt-2">
                <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Security Warnings</span>
                <span className={store.warningsCount > 0 ? "text-red-500 font-black animate-pulse" : "text-zinc-400 font-black"}>
                  {store.warningsCount} warning{store.warningsCount !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 3. EARLY SUBMISSION CONFIRMATION DIALOG */}
      <Dialog open={showSubmitModal} onOpenChange={setShowSubmitModal}>
        <DialogContent className="bg-zinc-950 border border-zinc-900 text-white max-w-sm rounded-2xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-sm font-bold text-white tracking-wide uppercase pl-0.5">
              Grade Arena Submission
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 font-semibold leading-normal">
              You are completing the match and locking in your current answers. Review your metrics before finalizing.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-2.5 text-xs font-bold border-y border-zinc-900/60">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Answered</span>
              <span className="text-cyan-400 font-black">{answeredCount} / {totalQuestions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Flagged Review</span>
              <span className="text-purple-400 font-black">{Object.keys(store.flags).filter(k => store.flags[k]).length} marked</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Remaining Time</span>
              <span className="text-white font-black">{formatSeconds(store.timeRemainingSeconds)}</span>
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-2.5 pt-4">
            <Button
              onClick={handleSubmitConfirmation}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white font-extrabold h-11 rounded-xl text-xs gap-1 shadow-[0_0_20px_rgba(168,85,247,0.2)]"
            >
              <CheckCircle className="h-4 w-4" /> Confirm Arena Submit
            </Button>
            <Button
              onClick={() => setShowSubmitModal(false)}
              className="w-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-bold h-10 rounded-xl text-xs"
            >
              Resume Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
