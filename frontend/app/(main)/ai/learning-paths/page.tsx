"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { generateLearningPath } from "@/features/ai/api";
import { useAIStore } from "@/features/ai/store/ai-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  BookOpen,
  Calendar,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function AILearningPathsPage() {
  const router = useRouter();

  const learningPaths = useAIStore((s) => s.learningPaths);
  const addLearningPath = useAIStore((s) => s.addLearningPath);
  const toggleMilestone = useAIStore((s) => s.toggleMilestone);

  const [topic, setTopic] = useState("");
  const [goal, setGoal] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !goal.trim()) {
      toast.warning("Please specify both a topic and a career goal.");
      return;
    }
    setIsGenerating(true);
    try {
      const path = await generateLearningPath(topic, goal);
      addLearningPath(path);
      setSelectedPathId(path.id);
      toast.success("AI Learning Roadmap generated successfully!");
      setTopic("");
      setGoal("");
    } catch (err) {
      toast.error("Failed to generate learning path.");
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedPath = learningPaths.find((p) => p.id === selectedPathId) || learningPaths[0];

  // Calculate progress
  const getProgressInfo = (path: typeof selectedPath) => {
    if (!path) return { percent: 0, completed: 0, total: 0 };
    const total = path.milestones.length;
    const completed = path.milestones.filter((m) => m.completed).length;
    return {
      percent: Math.round((completed / total) * 100),
      completed,
      total
    };
  };

  const progress = getProgressInfo(selectedPath);

  return (
    <div className="container px-4 py-8 mx-auto max-w-5xl space-y-8 relative z-10">
      
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
          <Brain className="h-4.5 w-4.5 text-purple-400" />
          <span className="text-[10px] font-extrabold uppercase text-purple-400 tracking-wider">
            Roadmap Architectures
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent mt-1.5 font-mono">
          AI Learning Paths
        </h1>
        <p className="text-xs text-zinc-500 font-semibold mt-1">
          Generate structured multi-stage learning roadmaps mapped dynamically to your targeting engineering objectives.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        
        {/* Left Column Form & History Selection (1/4 width) */}
        <div className="space-y-6 flex flex-col">
          
          {/* Generation deck */}
          <Card className="border-zinc-900 bg-zinc-950/40 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/2 via-transparent to-transparent pointer-events-none" />
            
            <form onSubmit={handleGenerate} className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Topic Domain</label>
                <Input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Apache Kafka"
                  className="bg-zinc-950 border-zinc-900 text-white placeholder-zinc-600 rounded-xl text-xs h-9.5"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Target Objective</label>
                <Input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g. Architect Swarm clusters"
                  className="bg-zinc-950 border-zinc-900 text-white placeholder-zinc-600 rounded-xl text-xs h-9.5"
                />
              </div>

              <Button
                type="submit"
                disabled={isGenerating}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white font-extrabold h-10 rounded-xl text-xs gap-1 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" /> Generate Road
                  </span>
                )}
              </Button>
            </form>
          </Card>

          {/* Paths history Selector stack */}
          {learningPaths.length > 0 && (
            <div className="space-y-2">
              <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Your Roadmaps</span>
              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                {learningPaths.map((p) => {
                  const active = selectedPath?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPathId(p.id)}
                      className={`text-left p-3.5 border rounded-xl transition-all text-xs font-bold truncate ${
                        active
                          ? "bg-purple-500/10 border-purple-500 text-purple-400"
                          : "bg-zinc-950/40 border-zinc-900 text-zinc-500 hover:border-zinc-850 hover:text-zinc-300"
                      }`}
                    >
                      {p.title}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Columns (3/4 width): Dynamic Milestone stage board */}
        <div className="md:col-span-3 space-y-5">
          <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.div
                key="loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 p-6 bg-zinc-950/20 border border-zinc-900 rounded-2xl gap-3 text-center"
              >
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">Compiling Learning Milestone Tracks</h3>
                <p className="text-[10px] text-zinc-500 font-semibold max-w-xs leading-relaxed mt-1">
                  Mindrift generative compilers are building structured chronological targets, sharding checklists, and resources mappings.
                </p>
              </motion.div>
            ) : selectedPath ? (
              <motion.div
                key="roadmap"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Milestone details Header */}
                <Card className="border-zinc-900 bg-zinc-950/40 relative overflow-hidden p-5">
                  <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4.5 w-4.5 text-cyan-400 animate-pulse" />
                        <h2 className="text-base font-black text-white tracking-wide uppercase leading-none">
                          {selectedPath.title}
                        </h2>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">
                        Focus: {selectedPath.topic} · Est: {selectedPath.estimatedWeeks} Weeks
                      </p>
                    </div>

                    <div className="flex flex-col items-center min-w-[90px] bg-zinc-900/40 border border-zinc-900 px-3.5 py-2 rounded-xl">
                      <span className="text-[7px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Completed</span>
                      <span className="text-sm font-black text-cyan-400 font-mono mt-0.5">{progress.percent}%</span>
                    </div>
                  </div>
                  <Progress value={progress.percent} className="h-2 bg-zinc-900 border border-zinc-800 mt-4" />
                </Card>

                {/* Milestones scroll list */}
                <div className="space-y-4">
                  {selectedPath.milestones.map((milestone, idx) => (
                    <div
                      key={milestone.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        milestone.completed
                          ? "bg-cyan-950/5 border-cyan-500/25"
                          : "bg-zinc-950/40 border-zinc-900"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={milestone.completed}
                            onChange={() => toggleMilestone(selectedPath.id, milestone.id)}
                            className="h-4.5 w-4.5 rounded border-zinc-850 text-purple-500 focus:ring-purple-500 accent-purple-500 cursor-pointer mt-0.5"
                          />
                          <div className="space-y-1">
                            <p className={`text-xs font-black text-white ${milestone.completed ? "line-through text-zinc-500" : ""}`}>
                              {milestone.title}
                            </p>
                            <p className="text-[11px] text-zinc-500 font-semibold leading-relaxed">
                              {milestone.description}
                            </p>
                          </div>
                        </div>

                        <Badge className="bg-zinc-900 border border-zinc-800 text-zinc-500 text-[8px] font-bold shrink-0">
                          Stage {idx + 1}
                        </Badge>
                      </div>

                      {/* Resource links */}
                      <div className="border-t border-zinc-900/40 mt-4 pt-3.5 space-y-1.5">
                        <span className="text-[8px] font-bold text-zinc-550 uppercase tracking-widest pl-0.5 block">Learning references</span>
                        <div className="flex flex-wrap gap-2.5">
                          {milestone.resources.map((res) => (
                            <a
                              key={res}
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                toast.info(`Opening resource: ${res}`);
                              }}
                              className="text-[10px] text-cyan-400 font-bold hover:underline flex items-center gap-1 leading-none uppercase tracking-wider"
                            >
                              {res} <ChevronRight className="h-3 w-3" />
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 p-6 bg-zinc-950/20 border border-zinc-900 rounded-2xl gap-3 text-center"
              >
                <HelpCircle className="h-10 w-10 text-zinc-750 animate-pulse" />
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">No Roadmap Selected</h3>
                <p className="text-[10px] text-zinc-600 font-semibold max-w-xs leading-relaxed mt-1">
                  Specify a subject domain and career objective in the architect deck to generate multi-stage engineering learning roadmaps.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
