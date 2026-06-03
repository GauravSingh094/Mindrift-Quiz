"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { sendAIChatMessage } from "@/features/ai/api";
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
  ChevronLeft,
  Send,
  MessageSquare,
  Bot
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function AIAssistantPage() {
  const router = useRouter();

  const conversations = useAIStore((s) => s.conversations);
  const addChatMessage = useAIStore((s) => s.addChatMessage);

  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Prompt library shortcut buttons (Task 12)
  const promptTemplates = [
    { title: "Docker Swarm Mesh", prompt: "Explain how Docker Swarm decendent ingress routing mesh works under load." },
    { title: "Kafka Retention Limits", prompt: "Detail how Kafka broker parameters 'log.retention.hours' protect consistency." },
    { title: "Next.js Hydration Priorities", prompt: "How does React 18 Suspense hydration priority solve page load jank?" }
  ];

  // Auto scroll to chat bottom
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversations, isTyping]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    
    // 1. Append user message
    const userMsg = {
      id: `chat_${Math.random() * 10000}`,
      role: "user" as const,
      text: textToSend,
      timestamp: new Date().toLocaleTimeString()
    };
    addChatMessage(userMsg);
    setInputText("");
    setIsTyping(true);

    // 2. Stream AI response
    try {
      const responseText = await sendAIChatMessage(textToSend);
      const aiMsg = {
        id: `chat_${Math.random() * 10000}`,
        role: "assistant" as const,
        text: responseText,
        timestamp: new Date().toLocaleTimeString()
      };
      addChatMessage(aiMsg);
    } catch (err) {
      toast.error("Failed to retrieve chat response.");
    } finally {
      setIsTyping(false);
    }
  };

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
          <Sparkles className="h-4.5 w-4.5 text-cyan-400" />
          <span className="text-[10px] font-extrabold uppercase text-cyan-400 tracking-wider">
            Conversational Neural Advisors
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent mt-1.5 font-mono">
          AI Chat Assistant
        </h1>
        <p className="text-xs text-zinc-500 font-semibold mt-1">
          Resolve engineering design paradoxes, review anti-cheat telemetry constraints, and check container Swarms rolling updates.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4 items-stretch h-[500px]">
        
        {/* Left Column Prompts Library Selector (1/4 width) */}
        <div className="flex flex-col gap-3.5 justify-start md:col-span-1 h-full overflow-y-auto pr-1">
          <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Prompt Shortcuts Library</span>
          {promptTemplates.map((item) => (
            <button
              key={item.title}
              onClick={() => handleSend(item.prompt)}
              className="text-left p-3.5 bg-zinc-950/40 border border-zinc-900 hover:border-purple-500/20 text-xs font-bold rounded-xl transition-all leading-normal group"
            >
              <span className="text-[8px] font-black uppercase text-purple-400 block mb-1 group-hover:text-cyan-400 transition-colors">
                {item.title}
              </span>
              <p className="text-zinc-500 font-semibold text-[10px] leading-relaxed group-hover:text-zinc-300 transition-colors">
                "{item.prompt}"
              </p>
            </button>
          ))}
        </div>

        {/* Center / Right Columns (3/4 width): Chat Messenger Console */}
        <Card className="md:col-span-3 border-zinc-900 bg-zinc-950/40 backdrop-blur-xl relative flex flex-col justify-between overflow-hidden h-full">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-500/1 via-transparent to-transparent pointer-events-none" />
          
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-zinc-900/50 flex items-center justify-between bg-zinc-950/20 z-10 shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-cyan-400 animate-pulse" />
              <div className="leading-none">
                <p className="text-xs font-black text-white">Neural Mentor Core</p>
                <span className="text-[8px] text-zinc-500 font-extrabold uppercase mt-0.5">Session Persistent dialogue</span>
              </div>
            </div>
            <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[8px] font-bold uppercase rounded-full">
              Gemini Pro Active
            </Badge>
          </div>

          {/* Scrolling messages container */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 pr-3 min-h-0">
            <AnimatePresence initial={false}>
              {conversations.map((msg) => {
                const isAI = msg.role === "assistant";
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-start gap-3.5 max-w-[85%] ${
                      isAI ? "mr-auto text-left" : "ml-auto flex-row-reverse text-right"
                    }`}
                  >
                    <div className={`h-6.5 w-6.5 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold uppercase border mt-0.5 ${
                      isAI 
                        ? "bg-cyan-500/5 border-cyan-500/25 text-cyan-400" 
                        : "bg-purple-500/5 border-purple-500/25 text-purple-400"
                    }`}>
                      {isAI ? "AI" : "U"}
                    </div>

                    <div className={`p-4 rounded-2xl border text-xs font-bold leading-relaxed ${
                      isAI 
                        ? "bg-zinc-950/60 border-zinc-900 text-zinc-350" 
                        : "bg-purple-950/10 border-purple-500/20 text-white"
                    }`}>
                      {msg.text}
                      <span className="text-[7px] text-zinc-650 font-bold block mt-1.5 tracking-wider">
                        {msg.timestamp}
                      </span>
                    </div>
                  </motion.div>
                );
              })}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-xs font-bold text-zinc-500 pl-2 animate-pulse"
                >
                  <Bot className="h-4 w-4 animate-spin text-cyan-400 shrink-0" />
                  <span>AI Mentor is composing guidance...</span>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>

          {/* Form input bar */}
          <div className="p-4 border-t border-zinc-900/50 bg-zinc-950/20 z-10 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(inputText);
              }}
              className="flex items-center gap-3.5"
            >
              <Input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask me anything (e.g. explain rolling updates)..."
                className="bg-zinc-950 border-zinc-900 text-white placeholder-zinc-600 focus-visible:ring-purple-500 rounded-xl text-xs h-11 pl-4"
              />
              <Button
                type="submit"
                disabled={!inputText.trim()}
                className="bg-purple-500 hover:bg-purple-600 text-white h-11 w-11 rounded-xl shrink-0 p-0 flex items-center justify-center disabled:opacity-30 shadow-[0_0_15px_rgba(168,85,247,0.1)]"
              >
                <Send className="h-4.5 w-4.5 fill-current pl-0.5" />
              </Button>
            </form>
          </div>
        </Card>

      </div>
    </div>
  );
}
