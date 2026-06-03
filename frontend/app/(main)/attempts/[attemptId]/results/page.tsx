"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAttemptResults, getQuizById } from "@/features/quiz/api";
import { QuizResultDetails } from "@/features/quiz/types";
import { Quiz, Question } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  Award,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Brain,
  HelpCircle,
  Loader2,
  Share2,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function QuizResultsPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.attemptId as string;

  const [results, setResults] = useState<QuizResultDetails | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

  // 1. Fetch attempt results and quiz specifications
  useEffect(() => {
    async function loadResults() {
      setIsLoading(true);
      try {
        const resData = await getAttemptResults(attemptId);
        setResults(resData);

        const quizData = await getQuizById(resData.quizId);
        setQuiz(quizData);
      } catch (err) {
        toast.error("Failed to load results. Returning to dashboard.");
        router.push("/dashboard");
      } finally {
        setIsLoading(false);
      }
    }
    loadResults();
  }, [attemptId]);

  const toggleQuestionExpand = (qId: string) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const handleShareResults = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link Copied!", {
      description: "Results dashboard link has been copied to your clipboard.",
    });
  };

  if (isLoading || !results || !quiz) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <p className="text-sm text-zinc-500 font-semibold tracking-wide animate-pulse">
          Computing cognitive score diagnostics...
        </p>
      </div>
    );
  }

  // Calculate correct vs incorrect count for Recharts Pie
  const correctCount = Math.round((results.accuracy / 100) * quiz.questions.length);
  const incorrectCount = quiz.questions.length - correctCount;

  const pieData = [
    { name: "Correct", value: correctCount, color: "#10b981" },
    { name: "Incorrect", value: incorrectCount, color: "#ef4444" },
  ];

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}m ${remainingSecs}s`;
  };

  return (
    <div className="container px-4 py-8 mx-auto max-w-7xl space-y-8 relative z-10">
      
      {/* 1. Results Title Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-6 w-full">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Attempt Finalized</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Quiz Performance Diagnostics
          </h1>
          <p className="text-xs text-zinc-500 font-semibold mt-1">
            Attempt ID: {results.attemptId} &bull; Quiz: {quiz.title}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleShareResults}
            variant="outline"
            className="border-zinc-900 bg-zinc-950/40 hover:bg-zinc-900 hover:text-white rounded-xl h-10 gap-1.5 px-4 font-bold text-xs"
          >
            <Share2 className="h-4 w-4" />
            <span>Share Result</span>
          </Button>

          <Button
            asChild
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold h-10 rounded-xl shadow-lg shadow-purple-500/10 px-5 gap-1.5"
          >
            <Link href={`/quizzes/${quiz.id}/attempt`}>
              <RotateCcw className="h-4 w-4" />
              <span>Retry Quiz</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. Key Metrics KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Score */}
        <Card className="border-zinc-900 bg-zinc-950/40 p-4.5 space-y-1 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/2 via-transparent to-transparent pointer-events-none" />
          <div className="flex justify-between items-center text-zinc-500 text-[10px] font-extrabold uppercase tracking-widest">
            <span>Score Points</span>
            <Brain className="h-4.5 w-4.5 text-purple-400" />
          </div>
          <p className="text-3xl font-black text-white">{results.score} XP</p>
          <p className="text-[10px] text-purple-400 font-bold uppercase">Locked in rewards multipliers</p>
        </Card>

        {/* Accuracy */}
        <Card className="border-zinc-900 bg-zinc-950/40 p-4.5 space-y-1 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/2 via-transparent to-transparent pointer-events-none" />
          <div className="flex justify-between items-center text-zinc-500 text-[10px] font-extrabold uppercase tracking-widest">
            <span>Average Accuracy</span>
            <Award className="h-4.5 w-4.5 text-cyan-400" />
          </div>
          <p className="text-3xl font-black text-white">{results.accuracy}%</p>
          <p className="text-[10px] text-cyan-400 font-bold uppercase">{correctCount} of {quiz.questions.length} Correct</p>
        </Card>

        {/* Time Taken */}
        <Card className="border-zinc-900 bg-zinc-950/40 p-4.5 space-y-1 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/2 via-transparent to-transparent pointer-events-none" />
          <div className="flex justify-between items-center text-zinc-500 text-[10px] font-extrabold uppercase tracking-widest">
            <span>Time Taken</span>
            <Clock className="h-4.5 w-4.5 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-white">{formatTime(results.timeTakenSeconds)}</p>
          <p className="text-[10px] text-emerald-400 font-bold uppercase">Estimated limit: {quiz.questions.length * 90}s</p>
        </Card>

        {/* Leaderboard Rank */}
        <Card className="border-zinc-900 bg-zinc-950/40 p-4.5 space-y-1 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/2 via-transparent to-transparent pointer-events-none" />
          <div className="flex justify-between items-center text-zinc-500 text-[10px] font-extrabold uppercase tracking-widest">
            <span>Arena Standings</span>
            <Trophy className="h-4.5 w-4.5 text-yellow-400 animate-bounce" />
          </div>
          <p className="text-3xl font-black text-white">#{results.rank}</p>
          <p className="text-[10px] text-yellow-400 font-bold uppercase">Among {results.totalParticipants} contestants</p>
        </Card>
      </div>

      {/* 3. Recharts Split Dashboard (col-span-8 & col-span-4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
        
        {/* Left main: AI Copilot & Question review (col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Recharts Correct vs Incorrect Accuracy Pie */}
          <Card className="border-zinc-900 bg-zinc-950/40 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-sm">
              <h3 className="text-base font-bold text-white tracking-wide">Accuracy breakdown</h3>
              <p className="text-xs text-zinc-500 leading-normal font-medium">
                Correct answers compared with incorrect or skipped attempts. Higher ratios guarantee badge multipliers.
              </p>
              <div className="flex gap-4 pt-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> {correctCount} Correct</span>
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /> {incorrectCount} Errors</span>
              </div>
            </div>
            <div className="h-[140px] w-[140px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: "10px",
                    }}
                  />
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* AI Copilot feedback box (Task 14) */}
          {results.aiFeedback && (
            <Card className="border-purple-500/20 bg-zinc-950/60 p-6 shadow-xl relative overflow-hidden space-y-4">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
              
              <div className="flex items-center gap-2">
                <div className="bg-purple-500/10 border border-purple-500/25 p-2 rounded-xl text-purple-400">
                  <Sparkles className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    AI Copilot Performance Diagnostics
                  </h3>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
                    Dynamic Learning Insights Engine
                  </p>
                </div>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed font-medium bg-zinc-900/30 p-4 border border-zinc-900 rounded-2xl">
                {results.aiFeedback}
              </p>

              {/* Weak Areas & Suggestions chips */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">
                    Weakness Targets
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {results.weakAreas?.map((item, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] font-bold uppercase px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">
                    Recommended Study Quizzes
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {results.recommendations?.map((item, idx) => (
                      <Link
                        href="/quizzes"
                        key={idx}
                        className="text-[9px] font-bold uppercase px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500 hover:text-white rounded-full transition-colors"
                      >
                        {item}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Answer Review Section (Task 15) */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 pl-1">
              Core Answer Explanations Review
            </h3>
            
            <div className="space-y-3">
              {quiz.questions.map((q, idx) => {
                const isExpanded = !!expandedQuestions[q.id];
                const userSelection = results.attemptId ? "Selected" : "Answered"; // Mock verification check

                return (
                  <div
                    key={q.id}
                    className="bg-zinc-950/40 border border-zinc-900 rounded-2xl overflow-hidden shadow-md transition-all"
                  >
                    <button
                      onClick={() => toggleQuestionExpand(q.id)}
                      className="w-full text-left p-4.5 flex items-center justify-between gap-4 hover:bg-zinc-900/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 text-xs font-bold text-zinc-400">
                          {idx + 1}
                        </div>
                        <span className="text-sm font-bold text-white tracking-wide truncate max-w-[240px] sm:max-w-[480px]">
                          {q.questionText.includes("```") ? q.questionText.split("```")[0] : q.questionText}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          Correct
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-4.5 w-4.5 text-zinc-500" />
                        ) : (
                          <ChevronDown className="h-4.5 w-4.5 text-zinc-500" />
                        )}
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          className="overflow-hidden border-t border-zinc-900/60 bg-zinc-950/60"
                        >
                          <div className="p-5 space-y-4">
                            <p className="text-xs text-zinc-300 font-semibold leading-relaxed">
                              {q.questionText.includes("```") ? q.questionText.split("```")[0] : q.questionText}
                            </p>

                            {/* Options with marked correct */}
                            <div className="grid grid-cols-1 gap-2.5">
                              {q.options.map((opt) => (
                                <div
                                  key={opt.id}
                                  className={`p-3.5 border rounded-xl flex items-center justify-between text-xs font-semibold ${
                                    opt.isCorrect
                                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.05)]"
                                      : "bg-zinc-950/40 border-zinc-900 text-zinc-500"
                                  }`}
                                >
                                  <span>{opt.optionText}</span>
                                  {opt.isCorrect && (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* Core explanation */}
                            <div className="p-4 bg-zinc-900 border border-zinc-850 rounded-2xl space-y-1.5">
                              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                                <HelpCircle className="h-3.5 w-3.5 text-purple-400" />
                                <span>Concept Explanation</span>
                              </span>
                              <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
                                Hydration mismatches are avoided by utilizing standard Suspense fallbacks. This isolates server compilation trees, preventing complete layout errors on client loads.
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right side: Leaderboard / multiplayer previews (col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Top Contestants list */}
          <Card className="border-zinc-900 bg-zinc-950/40 p-6 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest border-b border-zinc-900 pb-3 flex items-center gap-1.5">
              <Trophy className="h-4.5 w-4.5 text-yellow-500 animate-bounce" />
              <span>Contestants Leaderboard</span>
            </h3>

            <div className="space-y-3">
              {[
                { rank: 1, name: "Sarah Connor", score: 95 },
                { rank: 2, name: "Gaurav Singh", score: 95 },
                { rank: 3, name: "Alex Mercer", score: 95 },
                { rank: 4, name: "Arthur Dent (You)", score: 92, isUser: true },
                { rank: 5, name: "Ford Prefect", score: 88 },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    item.isUser
                      ? "bg-purple-500/5 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.05)]"
                      : "bg-zinc-900/10 border-zinc-900"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-extrabold w-4 text-center ${
                      item.rank <= 3 ? "text-yellow-400" : "text-zinc-500"
                    }`}>
                      #{item.rank}
                    </span>
                    <span className={`text-xs font-bold ${item.isUser ? "text-purple-400" : "text-white"}`}>
                      {item.name}
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-white">{item.score}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
