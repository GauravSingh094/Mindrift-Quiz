"use client";

import React, { useState, useEffect } from "react";
import { SpaceBackground } from "@/components/animations/space-background";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Award, Sparkles, TrendingUp, ShieldCheck } from "lucide-react";
import Link from "next/link";

interface Benefit {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const benefits: Benefit[] = [
  {
    id: 1,
    title: "AI-Powered Adaptive Learning",
    description: "Every quiz dynamically scales to your performance, targeting your exact cognitive growth opportunities.",
    icon: <Sparkles className="h-6 w-6 text-purple-400" />,
  },
  {
    id: 2,
    title: "Real-Time Competitive Arenas",
    description: "Battle live against global peers in high-stakes trivia and coding hack-speed runs.",
    icon: <Award className="h-6 w-6 text-cyan-400" />,
  },
  {
    id: 3,
    title: "Deep Skill Analytics Engine",
    description: "Visualize your learning metrics and map out your competency growth in real time.",
    icon: <TrendingUp className="h-6 w-6 text-emerald-400" />,
  },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeBenefit, setActiveBenefit] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveBenefit((prev) => (prev + 1) % benefits.length);
    }, 5500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative bg-black text-white selection:bg-purple-500/30 selection:text-purple-200 overflow-x-hidden">
      {/* Space Animation Canvas Background */}
      <SpaceBackground className="opacity-70 pointer-events-none" />

      {/* Left side: Premium Branding & Live Benefits Deck (Hidden on Mobile/Tablet) */}
      <div className="hidden md:flex md:w-1/2 lg:w-[55%] relative flex-col justify-between p-12 lg:p-16 border-r border-zinc-900 overflow-hidden">
        {/* Subtle grid lines background overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f0f14_1px,transparent_1px),linear-gradient(to_bottom,#0f0f14_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35" />
        
        {/* Top Header Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="bg-gradient-to-br from-purple-500 to-cyan-500 p-2.5 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.3)] group-hover:scale-105 transition-transform duration-300">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-black tracking-wider bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent group-hover:text-white transition-colors duration-300">
              MINDRIFT
            </span>
          </Link>
        </div>

        {/* Benefits Presentation */}
        <div className="relative z-10 my-auto max-w-xl space-y-12">
          <div className="space-y-4">
            <h2 className="text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight leading-[1.1] bg-gradient-to-br from-white via-zinc-100 to-zinc-500 bg-clip-text text-transparent">
              Empowering Minds, <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                One Challenge at a Time
              </span>
            </h2>
            <p className="text-zinc-400 text-base lg:text-lg leading-relaxed font-medium">
              Join thousands of learners challenging their limits through AI-driven competitive quiz engines and dynamic skill diagnostics.
            </p>
          </div>

          {/* Rotating Cards Deck */}
          <div className="relative min-h-[140px] w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeBenefit}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.45, ease: "easeInOut" }}
                className="bg-zinc-950/40 border border-zinc-800/60 p-6 rounded-2xl backdrop-blur-md shadow-2xl relative overflow-hidden flex items-start gap-4"
              >
                {/* Glow Ring inside Card */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-cyan-500/5 pointer-events-none" />
                
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                  {benefits[activeBenefit].icon}
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white tracking-wide">
                    {benefits[activeBenefit].title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                    {benefits[activeBenefit].description}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Slider Dots indicators */}
            <div className="flex gap-2.5 mt-4 ml-1">
              {benefits.map((benefit, idx) => (
                <button
                  key={benefit.id}
                  onClick={() => setActiveBenefit(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === activeBenefit ? "w-8 bg-purple-500" : "w-1.5 bg-zinc-800"
                  }`}
                  aria-label={`Show benefit item ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer info panel */}
        <div className="relative z-10 flex items-center justify-between text-xs text-zinc-500 font-semibold tracking-wider">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-purple-400" />
            <span>Secure Clerk Auth Flow</span>
          </div>
          <span>&copy; {new Date().getFullYear()} Mindrift. All rights reserved.</span>
        </div>
      </div>

      {/* Right side: Authentication forms card container */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 md:py-16 lg:px-12 relative z-10">
        
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="md:hidden flex flex-col items-center gap-3 mb-8 text-center">
          <div className="bg-gradient-to-br from-purple-500 to-cyan-500 p-2.5 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-wider bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              MINDRIFT
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">AI Learning Platform</p>
          </div>
        </div>

        {/* Main card wrapper sizing */}
        <div className="w-full max-w-[440px]">
          {children}
        </div>
      </div>
    </div>
  );
}