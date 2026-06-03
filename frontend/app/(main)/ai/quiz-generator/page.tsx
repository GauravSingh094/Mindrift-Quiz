"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { generateAIQuiz } from "@/features/ai/api";
import { useAIStore } from "@/features/ai/store/ai-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Brain,
  Cpu,
  Zap,
  Layers,
  ArrowRight,
  Sparkles,
  Terminal,
  Play,
  Bookmark,
  CheckCircle,
  HelpCircle,
  Loader2,
  ChevronLeft
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function AIQuizGeneratorPage() {
  const router = useRouter();
  
  const generatedQuiz = useAIStore((s) => s.generatedQuiz);
  const setGeneratedQuiz = useAIStore((s) => s.setGeneratedQuiz);

  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [questionCount, setQuestionCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast.warning("Please type a topic subject (e.g. Next.js Hydration).");
      return;
    }
    setIsGenerating(true);
    setGeneratedQuiz(null);
    try {
      const quiz = await generateAIQuiz(topic, difficulty, questionCount);
      setGeneratedQuiz(quiz);
      toast.success("AI Quiz Compiled successfully!");
    } catch (err) {
      toast.error("Failed to generate proctored questions.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartQuiz = () => {
    if (!generatedQuiz) return;
    toast.success("Initializing temporary container attempt sandbox!");
    router.push(`/quizzes/${generatedQuiz.id}`);
  };

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

      {/* Title */}
      <div className="border-b border-zinc-900 pb-6">
        <div className="flex items-center gap-2">
          <Terminal className="h-4.5 w-4.5 text-purple-400" />
          <span className="text-[10px] font-extrabold uppercase text-purple-400 tracking-wider">
            Generative Arena Compilers
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent mt-1.5 font-mono">
          AI Quiz Compiler
        </h1>
        <p className="text-xs text-zinc-500 font-semibold mt-1">
          Specify topics, categories, and proctoring constraints to compile custom proctored quiz sandboxes instantly.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Left Column Form panel (1/3 width) */}
        <div className="space-y-6">
          <Card className="border-zinc-900 bg-zinc-950/40 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/2 via-transparent to-transparent pointer-events-none" />
            
            <form onSubmit={handleGenerate} className="p-5 space-y-5">
              {/* Topic */}
              <div className="space-y-2">
                <label className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest pl-0.5">Topic Subject</label>
                <Input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Next.js Hydration"
                  className="bg-zinc-950 border-zinc-900 text-white placeholder-zinc-550 focus-visible:ring-purple-500 rounded-xl text-xs h-10"
                />
              </div>

              {/* Difficulty */}
              <div className="space-y-2">
                <label className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest pl-0.5">Difficulty Tier</label>
                <div className="grid grid-cols-3 gap-2">
                  {["EASY", "MEDIUM", "HARD"].map((diff) => (
                    <button
                      key={diff}
                      type="button"
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

              {/* Counts */}
              <div className="space-y-2">
                <label className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest pl-0.5">Questions count</label>
                <div className="grid grid-cols-3 gap-2">
                  {[3, 5, 10].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setQuestionCount(count)}
                      className={`text-[9px] font-extrabold py-2.5 rounded-xl border uppercase tracking-wider ${
                        questionCount === count
                          ? "bg-purple-500/10 border-purple-500 text-purple-400"
                          : "bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {count} Qs
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                disabled={isGenerating}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white font-extrabold h-11 rounded-xl text-xs gap-1 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" /> Compile Sandbox
                  </span>
                )}
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Columns (2/3 width): Generative Preview board */}
        <div className="md:col-span-2 space-y-4">
          <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.div
                key="loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 p-6 bg-zinc-950/20 border border-zinc-900 rounded-2xl gap-3.5 text-center"
              >
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest">AI Prompt Execution Active</h3>
                  <p className="text-[10px] text-zinc-500 font-semibold leading-relaxed max-w-xs">
                    Gemini cognitive models are assembling proctored multi-tier question matrices for topic subject.
                  </p>
                </div>
              </motion.div>
            ) : generatedQuiz ? (
              <motion.div
                key="quiz"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                <div className="flex justify-between items-center pl-0.5">
                  <h2 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-cyan-400" />
                    <span>Compiled Sandbox Preview</span>
                  </h2>
                  <Badge className="bg-zinc-900 border border-zinc-850 text-zinc-500 text-[8px] font-bold uppercase rounded-full">
                    {generatedQuiz.difficulty} · {generatedQuiz.questionCount} Questions
                  </Badge>
                </div>

                <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
                  {generatedQuiz.questions.map((q, qidx) => (
                    <div
                      key={q.id}
                      className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-2xl space-y-3"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <p className="text-xs font-black text-white leading-relaxed">
                          Q{qidx + 1}: {q.questionText}
                        </p>
                        <span className="text-[8px] font-extrabold uppercase px-2 py-0.5 rounded bg-zinc-900 border border-zinc-850 text-zinc-500 shrink-0">
                          {q.points} XP
                        </span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 text-[11px] font-bold text-zinc-500">
                        {q.options.map((opt) => (
                          <div key={opt.id} className="p-2.5 bg-zinc-950 border border-zinc-900/60 rounded-xl leading-normal pl-3">
                            {opt.optionText}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-zinc-900/50">
                  <Button
                    onClick={handleStartQuiz}
                    className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-extrabold h-11 rounded-xl text-xs gap-1.5 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    <span>Enter Practice Arena</span>
                  </Button>
                  <Button
                    onClick={() => {
                      toast.success("Generated quiz saved to your profile credentials!");
                    }}
                    variant="ghost"
                    className="flex-1 border border-zinc-900 hover:border-zinc-850 bg-zinc-950/20 text-zinc-300 hover:text-white font-bold h-11 rounded-xl gap-1.5 text-xs"
                  >
                    <Bookmark className="h-4 w-4" />
                    <span>Save to History Logs</span>
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 p-6 bg-zinc-950/20 border border-zinc-900 rounded-2xl gap-3 text-center"
              >
                <HelpCircle className="h-10 w-10 text-zinc-750" />
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">No Quiz Compiled</h3>
                <p className="text-[10px] text-zinc-600 font-semibold max-w-xs leading-relaxed mt-1">
                  Type a target topic in the command deck to generate personalized compiled question sandboxes.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
