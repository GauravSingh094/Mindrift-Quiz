"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createInterviewSession, sendInterviewAnswer } from "@/features/ai/api";
import { useAIStore } from "@/features/ai/store/ai-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Trophy,
  Brain,
  Cpu,
  Zap,
  Layers,
  ArrowRight,
  Sparkles,
  Terminal,
  Bookmark,
  CheckCircle,
  HelpCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Award,
  Play,
  ClipboardCheck,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function AIInterviewSimulatorPage() {
  const router = useRouter();

  const session = useAIStore((s) => s.interviewSession);
  const startInterview = useAIStore((s) => s.startInterview);
  const answerInterviewQuestion = useAIStore((s) => s.answerInterviewQuestion);
  const gradeInterviewQuestion = useAIStore((s) => s.gradeInterviewQuestion);
  const nextInterviewQuestion = useAIStore((s) => s.nextInterviewQuestion);
  const completeInterview = useAIStore((s) => s.completeInterview);

  const [role, setRole] = useState("Frontend Engineer");
  const [difficulty, setDifficulty] = useState("MID");
  const [isInitializing, setIsInitializing] = useState(false);
  
  const [answerInput, setAnswerInput] = useState("");
  const [isGrading, setIsGrading] = useState(false);
  const [activeFeedback, setActiveFeedback] = useState<string | null>(null);
  const [activeScore, setActiveScore] = useState<number | null>(null);

  const roles = ["Frontend Engineer", "Backend Engineer", "DevOps Engineer", "AI Engineer", "Solutions Architect"];

  const handleStart = async () => {
    setIsInitializing(true);
    try {
      const sess = await createInterviewSession(role, difficulty);
      startInterview(sess);
      setAnswerInput("");
      setActiveFeedback(null);
      setActiveScore(null);
      toast.success("AI Interview Simulation loaded!");
    } catch (err) {
      toast.error("Failed to load interview simulator.");
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!session) return;
    if (!answerInput.trim()) {
      toast.warning("Please type a detailed architectural answer.");
      return;
    }
    setIsGrading(true);
    try {
      const qidx = session.activeQuestionIndex;
      const res = await sendInterviewAnswer(session.id, qidx, answerInput);
      
      // Update store
      answerInterviewQuestion(answerInput);
      gradeInterviewQuestion(qidx, res.feedback, res.score);
      
      setActiveFeedback(res.feedback);
      setActiveScore(res.score);
      toast.success("AI graded your answer successfully!");
    } catch (err) {
      toast.error("Failed to submit answer grading.");
    } finally {
      setIsGrading(false);
    }
  };

  const handleNext = () => {
    if (!session) return;
    const isLast = session.activeQuestionIndex === session.QA.length - 1;
    if (isLast) {
      completeInterview();
      toast.success("Simulated interview completed! Loading score metrics.");
    } else {
      nextInterviewQuestion();
      setAnswerInput("");
      setActiveFeedback(null);
      setActiveScore(null);
    }
  };

  // Calculations for Completed screen
  const getOverallReport = () => {
    if (!session || session.status !== "COMPLETED") return { avgScore: 0 };
    const validScores = session.QA.filter(qa => qa.score !== undefined).map(qa => qa.score as number);
    const avg = validScores.length > 0 ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : 0;
    return {
      avgScore: avg
    };
  };

  const report = getOverallReport();

  return (
    <div className="container px-4 py-8 mx-auto max-w-4xl space-y-8 relative z-10">
      
      {/* Back button */}
      <Button 
        onClick={() => router.push("/ai")}
        variant="ghost" 
        className="text-zinc-500 hover:text-zinc-300 text-xs font-extrabold uppercase tracking-wider p-0 bg-transparent hover:bg-transparent"
      >
        ← Back to Hub
      </Button>

      {/* Page Header */}
      <div className="border-b border-zinc-900 pb-6">
        <div className="flex items-center gap-2">
          <Cpu className="h-4.5 w-4.5 text-purple-400" />
          <span className="text-[10px] font-extrabold uppercase text-purple-400 tracking-wider">
            Proctored simulators lounge
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent mt-1.5 font-mono">
          AI Interview Simulator
        </h1>
        <p className="text-xs text-zinc-500 font-semibold mt-1">
          Select target roles and difficulties to trigger dynamic architectural questions. User submits transcripts for real-time grading reports.
        </p>
      </div>

      <AnimatePresence mode="wait">
        
        {/* Phase 1: Setup config screen */}
        {(!session || (session.status === "COMPLETED" && isInitializing)) && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="border-zinc-900 bg-zinc-950/40 relative overflow-hidden p-6 space-y-6">
              <div className="absolute inset-0 bg-gradient-to-b from-purple-500/2 via-transparent to-transparent pointer-events-none" />
              
              <div className="space-y-4">
                <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest pl-0.5">Configuration Panel</h3>
                
                {/* Role selection */}
                <div className="space-y-2">
                  <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5 block">Engineering target role</span>
                  <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3">
                    {roles.map((r) => (
                      <button
                        key={r}
                        onClick={() => setRole(r)}
                        className={`text-[9px] font-extrabold p-3 rounded-xl border uppercase tracking-wider text-center ${
                          role === r
                            ? "bg-purple-500/10 border-purple-500 text-purple-400"
                            : "bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty Select */}
                <div className="space-y-2 pt-2">
                  <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5 block">Experience tier</span>
                  <div className="grid grid-cols-3 gap-2">
                    {["JUNIOR", "MID", "SENIOR"].map((diff) => (
                      <button
                        key={diff}
                        onClick={() => setDifficulty(diff)}
                        className={`text-[9px] font-extrabold py-2.5 rounded-xl border uppercase tracking-wider ${
                          difficulty === diff
                            ? "bg-purple-500/10 border-purple-500 text-purple-400"
                            : "bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleStart}
                  disabled={isInitializing}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white font-extrabold h-11 rounded-xl text-xs gap-1.5 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                >
                  {isInitializing ? (
                    <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Play className="h-4 w-4 fill-current" /> Initialize Simulator Arena
                    </span>
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Phase 2: Active simulating screen */}
        {session && session.status === "STARTED" && (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid gap-6 md:grid-cols-4 items-stretch h-[480px]"
          >
            {/* Left sidebar: Question status & telemetry proctor check */}
            <div className="flex flex-col gap-3.5 justify-start md:col-span-1 h-full overflow-y-auto pr-1">
              <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Session telemetry</span>
              
              <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-xl text-xs font-bold space-y-3">
                <div className="flex justify-between items-center pl-0.5">
                  <span className="text-zinc-500 uppercase tracking-wider text-[8px]">Session Rank</span>
                  <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[8px] font-bold uppercase rounded-full">
                    {session.difficulty}
                  </Badge>
                </div>
                <div className="flex justify-between items-center pl-0.5 border-t border-zinc-900/30 pt-2.5">
                  <span className="text-zinc-500 uppercase tracking-wider text-[8px]">Questions Status</span>
                  <span className="text-white font-black">{session.activeQuestionIndex + 1} / {session.QA.length}</span>
                </div>
                <div className="flex justify-between items-center pl-0.5 border-t border-zinc-900/30 pt-2.5">
                  <span className="text-zinc-500 uppercase tracking-wider text-[8px]">Sim status</span>
                  <span className="text-cyan-400 font-black flex items-center gap-1 animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> Active
                  </span>
                </div>
              </div>
            </div>

            {/* Center Messenger prompt workspace */}
            <Card className="md:col-span-3 border-zinc-900 bg-zinc-950/40 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between h-full">
              {/* Question area */}
              <div className="px-5 py-4 border-b border-zinc-900/50 bg-zinc-950/20 z-10 shrink-0">
                <p className="text-[8px] font-extrabold text-zinc-500 uppercase tracking-widest pl-0.5">Prompt Question</p>
                <h3 className="text-xs font-black text-white leading-relaxed mt-1 tracking-wide">
                  {session.QA[session.activeQuestionIndex]?.question}
                </h3>
              </div>

              {/* Textarea answer input / Graded feedback overlay */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 pr-3 min-h-0 relative">
                <AnimatePresence mode="wait">
                  {activeFeedback ? (
                    <motion.div
                      key="feedback"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-5 rounded-2xl bg-cyan-950/5 border border-cyan-500/25 space-y-3.5 text-xs font-bold leading-normal"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-cyan-400 uppercase tracking-widest text-[9px] flex items-center gap-1 pl-0.5">
                          <CheckCircle className="h-4 w-4 text-cyan-400" /> AI Grading Report
                        </span>
                        <span className="text-cyan-400 font-mono text-sm font-black">{activeScore} / 100</span>
                      </div>
                      <p className="text-zinc-350 font-semibold">{activeFeedback}</p>
                    </motion.div>
                  ) : (
                    <motion.div key="input" className="h-full">
                      <Textarea
                        value={answerInput}
                        onChange={(e) => setAnswerInput(e.target.value)}
                        placeholder="Type your complete technical answer, including patterns, algorithms and structures..."
                        className="bg-zinc-950/40 border-zinc-900 text-white placeholder-zinc-600 focus-visible:ring-purple-500 rounded-xl text-xs h-full min-h-[160px] max-h-none resize-none pl-4 pt-3.5"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action buttons */}
              <div className="p-4 border-t border-zinc-900/50 bg-zinc-950/20 z-10 shrink-0 flex gap-3">
                {activeFeedback ? (
                  <Button
                    onClick={handleNext}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white font-extrabold h-11 rounded-xl text-xs gap-1 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                  >
                    <span>
                      {session.activeQuestionIndex === session.QA.length - 1 ? "Complete Simulation" : "Next Question"}
                    </span>
                    <ChevronRight className="h-4.5 w-4.5" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={isGrading || !answerInput.trim()}
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-extrabold h-11 rounded-xl text-xs gap-1 disabled:opacity-35 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                  >
                    {isGrading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <ClipboardCheck className="h-4.5 w-4.5" /> Submit Answer Grader
                      </span>
                    )}
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Phase 3: Completed Report Card screen */}
        {session && session.status === "COMPLETED" && (
          <motion.div
            key="completed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-3xl mx-auto space-y-6"
          >
            <Card className="border-zinc-900 bg-zinc-950/40 relative overflow-hidden p-6 md:p-8">
              <div className="absolute inset-0 bg-gradient-to-b from-purple-500/2 via-transparent to-transparent pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-zinc-900">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="text-[9px] font-extrabold uppercase text-yellow-500 tracking-widest block pl-0.5">Championship Grade Sealed</span>
                  <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-wider">{session.role} simulator run completed</h2>
                  <p className="text-[10px] text-zinc-500 font-semibold uppercase">Grade telemetry checklist secured</p>
                </div>

                <div className="bg-zinc-900/40 border border-zinc-900 px-6 py-4 rounded-2xl text-center min-w-[130px]">
                  <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5 block">Overall Score</span>
                  <span className="text-2xl font-black text-cyan-400 tracking-wider font-mono mt-0.5">{report.avgScore} %</span>
                </div>
              </div>

              {/* QA Feedback review lists */}
              <div className="pt-6 space-y-5">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider pl-0.5">Transcript Feedback Review</h3>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {session.QA.map((qa, idx) => (
                    <div key={idx} className="p-4.5 bg-zinc-900/25 border border-zinc-900 rounded-2xl space-y-2.5">
                      <div className="flex justify-between items-center text-xs font-black">
                        <span className="text-white">Question {idx + 1}</span>
                        <span className="text-cyan-400 font-mono">{qa.score} pts</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 font-bold leading-relaxed">"{qa.question}"</p>
                      <p className="text-[10px] text-zinc-500 leading-normal pl-3.5 border-l border-purple-500/30">Your Answer: "{qa.answer}"</p>
                      <p className="text-[10px] text-cyan-400 leading-normal pl-3.5 border-l border-cyan-500/30 font-semibold">AI Coach: "{qa.feedback}"</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions panel */}
              <div className="pt-6 border-t border-zinc-900 flex justify-end">
                <Button
                  onClick={() => {
                    // Reset simulator
                    useAIStore.getState().clearStore();
                    router.push("/ai");
                  }}
                  className="bg-purple-500 hover:bg-purple-600 text-white font-extrabold h-11 px-6 rounded-xl text-xs gap-1 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                >
                  <CheckCircle className="h-4 w-4" /> Finalize Simulation Report
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
