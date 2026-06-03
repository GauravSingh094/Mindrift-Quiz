"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAIStore } from "@/features/ai/store/ai-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  History,
  MessageSquare,
  ChevronLeft
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function AIHistoryPage() {
  const router = useRouter();

  const historyQuizzes = useAIStore((s) => s.historyQuizzes);
  const historyPaths = useAIStore((s) => s.historyPaths);
  const historyInterviews = useAIStore((s) => s.historyInterviews);
  const conversations = useAIStore((s) => s.conversations);

  const [activeTab, setActiveTab] = useState("quizzes");

  const tabs = [
    { id: "quizzes", label: "Quizzes", count: historyQuizzes.length, icon: <Terminal className="h-4 w-4" /> },
    { id: "paths", label: "Roadmaps", count: historyPaths.length, icon: <Brain className="h-4 w-4" /> },
    { id: "interviews", label: "Interviews", count: historyInterviews.length, icon: <Cpu className="h-4 w-4" /> },
    { id: "chat", label: "Conversations", count: conversations.length > 1 ? 1 : 0, icon: <MessageSquare className="h-4 w-4" /> }
  ];

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
          <History className="h-4.5 w-4.5 text-purple-400 animate-pulse" />
          <span className="text-[10px] font-extrabold uppercase text-purple-400 tracking-wider">
            Historic Archives Desk
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent mt-1.5 font-mono">
          AI Activity History
        </h1>
        <p className="text-xs text-zinc-500 font-semibold mt-1">
          Review, restore, and resume generated sandbox practice sessions, milestones progression logs, and AI coaching dialogues.
        </p>
      </div>

      {/* Ranks list tabs */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-900/60 pb-4">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-[10px] font-extrabold px-4 py-2.5 rounded-xl transition-all border uppercase tracking-wider flex items-center gap-1.5 ${
                active
                  ? "bg-purple-500/10 border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                  : "bg-zinc-950/40 border-zinc-900 text-zinc-500 hover:border-zinc-800 hover:text-zinc-300"
              }`}
            >
              {tab.icon}
              <span>{tab.label} ({tab.count})</span>
            </button>
          );
        })}
      </div>

      {/* Grid results */}
      <div className="space-y-4">
        <AnimatePresence mode="wait">
          
          {/* 1. QUIZZES */}
          {activeTab === "quizzes" && (
            <motion.div
              key="quizzes"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-6 md:grid-cols-2"
            >
              {historyQuizzes.map((quiz) => (
                <Card key={quiz.id} className="border-zinc-900 bg-zinc-950/40 relative overflow-hidden group hover:border-zinc-800 transition-all flex flex-col justify-between min-h-[180px]">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center w-full">
                      <span className="text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {quiz.difficulty} difficulty
                      </span>
                      <span className="text-[9px] text-zinc-500 font-bold uppercase">
                        {new Date(quiz.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <CardTitle className="text-xs font-black text-white uppercase tracking-wider group-hover:text-purple-400 mt-2 transition-colors">
                      {quiz.topic} Sandbox
                    </CardTitle>
                    <CardDescription className="text-[10px] text-zinc-500 font-semibold uppercase mt-0.5">
                      Compiled {quiz.questionCount} Questions
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-2 border-t border-zinc-900/50 bg-zinc-950/20 flex justify-between items-center text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">
                    <Button
                      onClick={() => router.push(`/quizzes/${quiz.id}`)}
                      className="bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-300 font-extrabold h-9 text-[9px] rounded-lg gap-1 uppercase"
                    >
                      <Play className="h-3 w-3 fill-current" /> Play Practice
                    </Button>
                    <span>ID: {quiz.id}</span>
                  </CardFooter>
                </Card>
              ))}

              {historyQuizzes.length === 0 && (
                <div className="md:col-span-2 text-center py-16 bg-zinc-950/20 border border-zinc-900 rounded-2xl">
                  <Terminal className="h-10 w-10 text-zinc-750 mx-auto mb-3" />
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">No Generated Quizzes</h3>
                  <p className="text-[10px] text-zinc-550 font-semibold max-w-xs mx-auto mt-1 leading-relaxed">
                    AI generated custom topic practice sandboxes will reside in this vault.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* 2. PATHS */}
          {activeTab === "paths" && (
            <motion.div
              key="paths"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-6 md:grid-cols-2"
            >
              {historyPaths.map((path) => (
                <Card key={path.id} className="border-zinc-900 bg-zinc-950/40 relative overflow-hidden group hover:border-zinc-800 transition-all flex flex-col justify-between min-h-[180px]">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center w-full">
                      <span className="text-[8px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 animate-pulse">
                        Roadmap generated
                      </span>
                      <span className="text-[9px] text-zinc-500 font-bold uppercase">
                        {new Date(path.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <CardTitle className="text-xs font-black text-white uppercase tracking-wider group-hover:text-purple-400 mt-2 transition-colors">
                      {path.title}
                    </CardTitle>
                    <CardDescription className="text-[10px] text-zinc-500 font-semibold uppercase mt-0.5">
                      Stage milestones count: {path.milestones.length}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-2 border-t border-zinc-900/50 bg-zinc-950/20 flex justify-between items-center text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">
                    <Button
                      onClick={() => router.push("/ai/learning-paths")}
                      className="bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-300 font-extrabold h-9 text-[9px] rounded-lg gap-1 uppercase"
                    >
                      <ArrowRight className="h-3 w-3" /> Restore path view
                    </Button>
                    <span>{path.estimatedWeeks} Wks est</span>
                  </CardFooter>
                </Card>
              ))}

              {historyPaths.length === 0 && (
                <div className="md:col-span-2 text-center py-16 bg-zinc-950/20 border border-zinc-900 rounded-2xl">
                  <Brain className="h-10 w-10 text-zinc-750 mx-auto mb-3" />
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">No Generated Roadmaps</h3>
                  <p className="text-[10px] text-zinc-550 font-semibold max-w-xs mx-auto mt-1 leading-relaxed">
                    AI generated custom chronological stage roadmaps will reside in this vault.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* 3. INTERVIEWS */}
          {activeTab === "interviews" && (
            <motion.div
              key="interviews"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-6 md:grid-cols-2"
            >
              {historyInterviews.map((session) => (
                <Card key={session.id} className="border-zinc-900 bg-zinc-950/40 relative overflow-hidden group hover:border-zinc-800 transition-all flex flex-col justify-between min-h-[180px]">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center w-full">
                      <span className="text-[8px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {session.difficulty} difficulty
                      </span>
                      <span className="text-[9px] text-zinc-500 font-bold uppercase">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <CardTitle className="text-xs font-black text-white uppercase tracking-wider group-hover:text-purple-400 mt-2 transition-colors">
                      {session.role} Simulation run
                    </CardTitle>
                    <CardDescription className="text-[10px] text-zinc-500 font-semibold uppercase mt-0.5">
                      Status: {session.status} · Questions: {session.QA.length}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-2 border-t border-zinc-900/50 bg-zinc-950/20 flex justify-between items-center text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">
                    <Button
                      onClick={() => router.push("/ai/interview-simulator")}
                      className="bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-300 font-extrabold h-9 text-[9px] rounded-lg gap-1 uppercase"
                    >
                      <ArrowRight className="h-3 w-3" /> Restore simulation
                    </Button>
                    <span>ID: {session.id}</span>
                  </CardFooter>
                </Card>
              ))}

              {historyInterviews.length === 0 && (
                <div className="md:col-span-2 text-center py-16 bg-zinc-950/20 border border-zinc-900 rounded-2xl">
                  <Cpu className="h-10 w-10 text-zinc-750 mx-auto mb-3" />
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">No Simulated Sessions</h3>
                  <p className="text-[10px] text-zinc-550 font-semibold max-w-xs mx-auto mt-1 leading-relaxed">
                    Historic proctored mock interview simulation runs will reside in this vault.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* 4. CHAT MESSAGE PREVIEWS */}
          {activeTab === "chat" && (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {conversations.length > 1 ? (
                <Card className="border-zinc-900 bg-zinc-950/40 relative overflow-hidden flex flex-col justify-between min-h-[160px] p-5">
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                    <div className="space-y-0.5">
                      <h3 className="text-xs font-black text-white uppercase tracking-wider">AI dialogue logs</h3>
                      <span className="text-[8px] text-zinc-500 font-extrabold uppercase block tracking-wider">Active continuous thread persistent</span>
                    </div>
                    <Button
                      onClick={() => router.push("/ai/assistant")}
                      className="bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-300 font-extrabold h-9 text-[9px] rounded-lg gap-1.5 uppercase"
                    >
                      <span>Resume Chat dialogue</span> <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="text-[10px] font-bold text-zinc-500 uppercase leading-relaxed mt-4">
                    ✓ Core persists {conversations.length} conversation messages. Latest sync: {conversations[conversations.length - 1]?.timestamp}.
                  </div>
                </Card>
              ) : (
                <div className="text-center py-16 bg-zinc-950/20 border border-zinc-900 rounded-2xl">
                  <MessageSquare className="h-10 w-10 text-zinc-750 mx-auto mb-3" />
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">No Conversations Active</h3>
                  <p className="text-[10px] text-zinc-550 font-semibold max-w-xs mx-auto mt-1 leading-relaxed">
                    AI Mentor conversations details will reside in this vault once initiated.
                  </p>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}
