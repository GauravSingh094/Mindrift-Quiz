"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuizStore } from "@/features/quiz/store/quiz-store";
import { getQuizById, submitQuestionAnswer, submitQuizAttempt } from "@/features/quiz/api";
import {
  ChoiceRenderer,
  TrueFalseRenderer,
  FillBlankRenderer,
  ShortAnswerRenderer,
  CodeSnippetRenderer,
} from "@/features/quiz/components/question-renderers";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Brain,
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  Send,
  Maximize2,
  Minimize2,
  ShieldAlert,
  Loader2,
  ClipboardPaste,
  EyeOff,
  Keyboard,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Quiz, Question } from "@/types";

export default function QuizAttemptPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.id as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Zustand Store bindings
  const store = useQuizStore();

  const activeQuestion: Question | undefined = store.questions[store.currentQuestionIndex];
  const totalQuestions = store.questions.length;
  const answeredCount = Object.keys(store.answers).length;
  const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  // 1. Fetch Quiz & Initialize Attempt Store
  useEffect(() => {
    async function loadQuiz() {
      setIsLoading(true);
      try {
        const data = await getQuizById(quizId);
        setQuiz(data);
        
        // Initialize Zustand attempt store
        store.startAttempt({
          attemptId: `att_${Date.now()}`,
          quizId: data.id,
          questions: data.questions,
          timeLimitSeconds: data.questions.length * 90, // 90 secs per question
        });
      } catch (err) {
        toast.error("Failed to load quiz details.");
        router.push("/quizzes");
      } finally {
        setIsLoading(false);
      }
    }
    loadQuiz();

    return () => {
      store.clearStore();
    };
  }, [quizId]);

  // 2. Active Countdown timer decrements
  useEffect(() => {
    if (store.status !== "STARTED" || store.timeRemainingSeconds <= 0) {
      if (store.status === "EXPIRED" || (store.status === "STARTED" && store.timeRemainingSeconds === 0)) {
        handleAutoSubmit();
      }
      return;
    }

    const timer = setInterval(() => {
      store.tickTimer();
    }, 1000);

    return () => clearInterval(timer);
  }, [store.timeRemainingSeconds, store.status]);

  // Auto-submit on timer expiry
  const handleAutoSubmit = async () => {
    toast.error("Time Expired!", {
      description: "Your session time limit has run out. Submitting attempt automatically.",
    });
    await triggerFinalSubmission();
  };

  // 3. Proctored Anti-Cheat monitoring (Tab switches & clipboards locks)
  useEffect(() => {
    if (store.status !== "STARTED") return;

    // A. Tab switching checks
    const handleVisibilityChange = () => {
      if (document.hidden) {
        store.addWarning(
          "TAB_SWITCH",
          "Tab switch detected. Browsing away is logged."
        );
        toast.error("Security Violation: Tab Switch", {
          description: "Navigating away from the quiz has been logged by the proctor.",
        });
      }
    };

    // B. Copy, Cut, Paste locks
    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      const type = e.type === "paste" ? "CLIPBOARD_PASTE" : "CLIPBOARD_COPY";
      store.addWarning(type, `Clipboard ${e.type} operation blocked.`);
      toast.error(`Clipboard Lock active`, {
        description: "Clipboard cut, copy, and paste commands are disabled.",
      });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("copy", handleCopyPaste);
    document.addEventListener("paste", handleCopyPaste);
    document.addEventListener("cut", handleCopyPaste);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
      document.removeEventListener("cut", handleCopyPaste);
    };
  }, [store.status]);

  // 4. Keyboard Shortcuts navigation (Prev, Next, Flag)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (store.status !== "STARTED") return;
      
      // Avoid shortcuts if user is typing inside text input / textareas
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "ArrowRight") {
        store.nextQuestion();
      } else if (e.key === "ArrowLeft") {
        store.prevQuestion();
      } else if (e.key === "f" || e.key === "F") {
        if (activeQuestion) store.toggleFlag(activeQuestion.id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [store.status, activeQuestion]);

  // 5. Answer Selection synchronizer
  const handleAnswerSelect = async (ansId: string) => {
    if (!activeQuestion) return;
    store.answerQuestion(activeQuestion.id, ansId);

    // Call async API answer sync (TanStack Query emulated apiClient call)
    try {
      await submitQuestionAnswer({
        attemptId: store.attemptId,
        questionId: activeQuestion.id,
        answerOptionId: ansId,
        timeSpentSeconds: 5,
      });
    } catch (err) {
      console.warn("Failed to sync answer to server, logged in local cache.");
    }
  };

  // 6. Fullscreen Focus Mode toggling
  const toggleFocusMode = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        store.setFocusMode(true);
        toast.success("Fullscreen Focus Mode Active", {
          description: "Distractions hidden. Press Escape to exit.",
        });
      }).catch(() => {
        toast.error("Failed to enter fullscreen mode.");
      });
    } else {
      document.exitFullscreen();
      store.setFocusMode(false);
      store.addWarning("FULLSCREEN_EXIT", "Focus mode exited.");
    }
  };

  // Listen to Escape exits of focus mode
  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        store.setFocusMode(false);
      }
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  // 7. Complete Submit attempt sync
  const triggerFinalSubmission = async () => {
    setIsSubmitting(true);
    try {
      const response = await submitQuizAttempt({
        attemptId: store.attemptId,
        answers: store.answers,
        warningsCount: store.warnings.length,
      });

      store.completeAttempt();
      setShowSubmitDialog(false);
      
      toast.success("Quiz Completed!", {
        description: "Your answers were submitted. Loading result dashboards.",
      });

      // Forward to results screen
      router.push(`/attempts/${store.attemptId}/results`);
    } catch (err) {
      toast.error("Failed to submit attempt. Please retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Check if warning threshold crossed (less than 60 seconds)
  const isTimeCritical = store.timeRemainingSeconds < 60;

  if (isLoading || !quiz || !activeQuestion) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <p className="text-sm text-zinc-500 font-semibold tracking-wide">
          Loading focus attempt arena...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col selection:bg-purple-500/20">
      
      {/* 1. Header Toolbar */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4.5 flex items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/quizzes")}
            className="border-zinc-900 bg-zinc-950 hover:bg-zinc-900 hover:text-white rounded-xl h-10 w-10 text-zinc-400"
          >
            <LogOut className="h-4.5 w-4.5" />
          </Button>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide truncate max-w-[200px] sm:max-w-[340px]">
              {quiz.title}
            </h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              Attempt Focus Environment
            </p>
          </div>
        </div>

        {/* Center Progress Ring */}
        <div className="hidden md:flex items-center gap-3 flex-1 max-w-sm mx-auto">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider whitespace-nowrap">
            {answeredCount} / {totalQuestions} Answered
          </span>
          <Progress value={progressPercent} className="h-1.5 bg-zinc-900" />
        </div>

        {/* Right Timers & CTA Actions */}
        <div className="flex items-center gap-3">
          {/* Ticking Timer */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl font-mono text-sm font-extrabold shadow-inner ${
              isTimeCritical
                ? "bg-red-500/10 border-red-500/30 text-red-400 animate-pulse"
                : "bg-zinc-900/50 border-zinc-900 text-zinc-300"
            }`}
          >
            <Clock className="h-4.5 w-4.5" />
            <span>{formatTimer(store.timeRemainingSeconds)}</span>
          </div>

          {/* Fullscreen focus toggle */}
          <Button
            onClick={toggleFocusMode}
            variant="outline"
            size="icon"
            className="border-zinc-900 bg-zinc-950/40 hover:bg-zinc-900 hover:text-white h-10 w-10 rounded-xl hidden sm:inline-flex text-zinc-400"
          >
            {store.isFocusModeActive ? (
              <Minimize2 className="h-4.5 w-4.5" />
            ) : (
              <Maximize2 className="h-4.5 w-4.5" />
            )}
          </Button>

          {/* Submit */}
          <Button
            onClick={() => setShowSubmitDialog(true)}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold h-10 rounded-xl shadow-lg shadow-purple-500/10 px-5 gap-1.5"
          >
            <span>Submit</span>
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      {/* Mobile progress bar */}
      <div className="md:hidden w-full bg-zinc-900 h-1">
        <div className="bg-purple-500 h-1 transition-all duration-300" style={{ width: `${progressPercent}%` }} />
      </div>

      {/* 2. Main Arena Split layout */}
      <main className="flex-1 container px-4 py-8 mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left side: Question renderers & actions (col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={store.currentQuestionIndex}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.25 }}
              className="bg-zinc-950/40 border border-zinc-900 p-6 sm:p-8 rounded-3xl relative overflow-hidden space-y-6 shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/2 via-transparent to-transparent pointer-events-none" />

              {/* Question metadata badge bar */}
              <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  Question {store.currentQuestionIndex + 1} of {totalQuestions}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-extrabold uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full">
                    {quiz.difficulty}
                  </span>
                  <span className="text-[9px] font-extrabold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                    +100 XP
                  </span>
                </div>
              </div>

              {/* Question text */}
              <div className="space-y-4">
                <h2 className="text-lg sm:text-xl font-bold leading-relaxed text-white tracking-wide">
                  {activeQuestion.questionText.includes("```")
                    ? activeQuestion.questionText.split("```")[0]
                    : activeQuestion.questionText}
                </h2>
              </div>

              {/* Custom renderer selection based on options size */}
              <div className="pt-2">
                {activeQuestion.questionText.includes("```") ? (
                  <CodeSnippetRenderer
                    question={activeQuestion}
                    selectedAnswer={store.answers[activeQuestion.id]}
                    onAnswerSelect={handleAnswerSelect}
                  />
                ) : activeQuestion.options && activeQuestion.options.length === 2 && 
                    (activeQuestion.options[0]?.optionText.toLowerCase() === "true" || 
                     activeQuestion.options[0]?.optionText.toLowerCase() === "false") ? (
                  <TrueFalseRenderer
                    question={activeQuestion}
                    selectedAnswer={store.answers[activeQuestion.id]}
                    onAnswerSelect={handleAnswerSelect}
                  />
                ) : activeQuestion.options && activeQuestion.options.length > 0 ? (
                  <ChoiceRenderer
                    question={activeQuestion}
                    selectedAnswer={store.answers[activeQuestion.id]}
                    onAnswerSelect={handleAnswerSelect}
                  />
                ) : (
                  <ShortAnswerRenderer
                    question={activeQuestion}
                    selectedAnswer={store.answers[activeQuestion.id]}
                    onAnswerSelect={handleAnswerSelect}
                  />
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Action trigger deck (Back, Next, Flag Review) */}
          <div className="flex justify-between items-center bg-zinc-950/60 p-4 border border-zinc-900 rounded-2xl">
            <div className="flex gap-2">
              <Button
                onClick={store.prevQuestion}
                disabled={store.currentQuestionIndex === 0}
                variant="outline"
                className="border-zinc-900 bg-zinc-950/40 text-zinc-400 hover:text-white rounded-xl h-10 gap-1.5 px-4 font-bold text-xs"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Prev</span>
              </Button>
              <Button
                onClick={store.nextQuestion}
                disabled={store.currentQuestionIndex === totalQuestions - 1}
                variant="outline"
                className="border-zinc-900 bg-zinc-950/40 text-zinc-400 hover:text-white rounded-xl h-10 gap-1.5 px-4 font-bold text-xs"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Flag Review Toggle */}
            <Button
              onClick={() => store.toggleFlag(activeQuestion.id)}
              variant="ghost"
              className={`h-10 rounded-xl gap-1.5 px-4 font-bold text-xs ${
                store.flags[activeQuestion.id]
                  ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Flag className={`h-4 w-4 ${store.flags[activeQuestion.id] ? "fill-current" : ""}`} />
              <span>{store.flags[activeQuestion.id] ? "Flagged" : "Flag for Review"}</span>
            </Button>
          </div>
        </div>

        {/* Right side column (col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Question navigator dots grid */}
          <div className="bg-zinc-950/40 border border-zinc-900 p-6 rounded-3xl relative overflow-hidden shadow-2xl space-y-4">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/1 via-transparent to-transparent pointer-events-none" />
            
            <h3 className="text-xs font-bold text-white uppercase tracking-widest border-b border-zinc-900 pb-3">
              Question Board Navigation
            </h3>

            <div className="grid grid-cols-5 gap-2.5">
              {store.questions.map((q, idx) => {
                const isCurrent = store.currentQuestionIndex === idx;
                const isAnswered = !!store.answers[q.id];
                const isFlagged = !!store.flags[q.id];

                return (
                  <button
                    key={q.id}
                    onClick={() => store.jumpToQuestion(idx)}
                    className={`h-10 w-full rounded-xl border flex items-center justify-center text-xs font-extrabold transition-all select-none ${
                      isCurrent
                        ? "bg-purple-500 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                        : isFlagged
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                        : isAnswered
                        ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                        : "bg-zinc-900/40 border-zinc-900 text-zinc-500 hover:border-zinc-800 hover:text-zinc-300"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Guide labels */}
            <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2 border-t border-zinc-900/60 text-[9px] font-bold text-zinc-500 uppercase tracking-wider pl-1">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-purple-500" /> Current
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-cyan-500/20 border border-cyan-500/40" /> Answered
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-500/20 border border-amber-500/40" /> Flagged
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-zinc-900 border border-zinc-800" /> Unvisited
              </span>
            </div>
          </div>

          {/* Anti-cheat Proctored monitoring feed */}
          <div className="bg-zinc-950/40 border border-orange-500/10 p-6 rounded-3xl relative overflow-hidden shadow-2xl space-y-4">
            <h3 className="text-xs font-bold text-orange-400 uppercase tracking-widest border-b border-zinc-900 pb-3 flex items-center gap-1.5">
              <ShieldAlert className="h-4.5 w-4.5" />
              <span>Proctored Security Feed</span>
            </h3>

            <div className="space-y-3.5">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-zinc-500">Tab Switch Count</span>
                <span className={store.tabSwitchesCount > 0 ? "text-red-400 font-extrabold" : "text-zinc-400"}>
                  {store.tabSwitchesCount} / 3
                </span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-zinc-500">Clipboard Paste Warnings</span>
                <span className={store.copyPasteAttemptsCount > 0 ? "text-red-400 font-extrabold" : "text-zinc-400"}>
                  {store.copyPasteAttemptsCount} Warning
                </span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-zinc-500">Fullscreen Focus Mode</span>
                <span className={store.isFocusModeActive ? "text-emerald-400 font-bold" : "text-zinc-500"}>
                  {store.isFocusModeActive ? "Active" : "Disabled"}
                </span>
              </div>
            </div>

            {/* Warnings list feed */}
            {store.warnings.length > 0 && (
              <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-3.5 space-y-1.5">
                <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest pl-0.5">
                  Recent Alerts
                </span>
                <div className="max-h-24 overflow-y-auto space-y-1 pr-1 font-mono text-[9px] text-red-300">
                  {store.warnings.map((w, idx) => (
                    <div key={idx} className="flex justify-between gap-2 border-b border-red-950/20 py-0.5">
                      <span className="truncate">{w.message}</span>
                      <span className="text-red-500 shrink-0">{w.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Quick Keyboard shortcuts guide */}
          <div className="hidden lg:flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-wider pl-4">
            <Keyboard className="h-4.5 w-4.5 text-zinc-600" />
            <span>Key Nav: Left/Right to slide &bull; F to Flag</span>
          </div>
        </div>
      </main>

      {/* 3. Confirm Submit Modal Dialog (Task 11) */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="border-zinc-900 bg-zinc-950 shadow-2xl rounded-3xl max-w-sm">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg font-bold text-white tracking-wide">
              Submit Quiz Attempt?
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 font-medium leading-relaxed">
              You have answered <strong>{answeredCount}</strong> out of <strong>{totalQuestions}</strong> questions. 
              {answeredCount < totalQuestions && (
                <span className="text-red-400 block mt-1 font-semibold">
                  Warning: You have {totalQuestions - answeredCount} unanswered questions remaining.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex flex-col gap-2">
            <Button
              onClick={triggerFinalSubmission}
              disabled={isSubmitting}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold h-11 rounded-xl shadow-lg shadow-purple-500/10"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2 justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting Attempt...
                </span>
              ) : (
                "Complete Submission"
              )}
            </Button>
            <Button
              onClick={() => setShowSubmitDialog(false)}
              disabled={isSubmitting}
              variant="outline"
              className="w-full border-zinc-900 bg-zinc-950 text-zinc-400 hover:text-white h-11 rounded-xl"
            >
              Cancel & Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
