"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAttemptHistory, getQuizzes } from "@/features/quiz/api";
import { QuizAttempt, Quiz } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Award, Clock, Calendar, ArrowRight, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { EmptyState } from "@/components/dashboard/empty-state";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AttemptsHistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<QuizAttempt[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch history attempts and quizzes
  useEffect(() => {
    async function loadHistory() {
      setIsLoading(true);
      try {
        const historyData = await getAttemptHistory();
        setHistory(historyData);

        const quizzesData = await getQuizzes();
        setQuizzes(quizzesData);
      } catch (err) {
        console.error("Failed to load attempt history details.");
      } finally {
        setIsLoading(false);
      }
    }
    loadHistory();
  }, []);

  const getQuizDetails = (quizId: string) => {
    return quizzes.find((q) => q.id === quizId) || {
      title: "Asynchronous Web Engineering Test",
      category: "Frontend",
      difficulty: "medium",
    };
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}m ${remainingSecs}s`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <p className="text-sm text-zinc-500 font-semibold tracking-wide animate-pulse">
          Fetching attempts history records...
        </p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="container px-4 py-12 mx-auto max-w-4xl">
        <EmptyState
          title="No History Found"
          description="Complete quizzes and competitions to accumulate score entries."
          icon={Brain}
          actionText="Browse quizzes"
          onActionClick={() => router.push("/quizzes")}
        />
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto max-w-4xl space-y-8 relative z-10">
      
      {/* Title */}
      <div className="border-b border-zinc-900 pb-6">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
          Your Attempts History
        </h1>
        <p className="text-xs text-zinc-500 font-semibold mt-1.5">
          Inspect your past accuracy marks, points, and average quiz ratios.
        </p>
      </div>

      {/* History entries cards */}
      <div className="space-y-4">
        {history.map((attempt, idx) => {
          const quizDetails = getQuizDetails(attempt.quizId);
          return (
            <motion.div
              key={attempt.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
            >
              <Card className="border-zinc-900 bg-zinc-950/40 backdrop-blur-xl relative overflow-hidden hover:border-zinc-800 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/2 via-transparent to-transparent pointer-events-none" />

                <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-sm font-bold text-white tracking-wide">
                        {quizDetails.title}
                      </h3>
                      <span className="text-[8px] font-extrabold uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full">
                        {quizDetails.difficulty}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-wider pl-0.5">
                      <span className="flex items-center gap-1">
                        <Award className="h-3.5 w-3.5 text-cyan-400" />
                        <span>Accuracy: {attempt.percentage}%</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Time: {formatTime(attempt.durationSeconds)}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-purple-400" />
                        <span>
                          {formatDistanceToNow(new Date(attempt.completedAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t border-zinc-900/60 md:border-transparent pt-3 md:pt-0">
                    <div className="text-left md:text-right">
                      <span className="text-base font-black text-white">
                        {attempt.score || Math.round(attempt.percentage * 10)}
                      </span>
                      <span className="text-[9px] text-zinc-500 block font-bold uppercase">XP Point</span>
                    </div>

                    <Button
                      asChild
                      variant="outline"
                      className="border-zinc-900 bg-zinc-950/40 hover:bg-zinc-900 hover:text-white h-9 rounded-xl font-bold text-xs gap-1"
                    >
                      <Link href={`/attempts/${attempt.id}/results`}>
                        <span>Diagnostics</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>

                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
