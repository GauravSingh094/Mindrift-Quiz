"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Brain, Trophy, Cpu, Settings } from "lucide-react";
import { motion } from "framer-motion";

export function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Home", icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: "/quizzes", label: "Quizzes", icon: <Brain className="h-5 w-5" /> },
    { href: "/leaderboard", label: "Ranks", icon: <Trophy className="h-5 w-5" /> },
    { href: "/ai", label: "AI Hub", icon: <Cpu className="h-5 w-5" /> },
    { href: "/settings", label: "Settings", icon: <Settings className="h-5 w-5" /> }
  ];

  return (
    <div className="fixed bottom-4 left-4 right-4 md:hidden z-50">
      <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-2.5 flex items-center justify-around shadow-[0_8px_32px_rgba(0,0,0,0.6)] relative overflow-hidden">
        {/* Glow ambient */}
        <div className="absolute inset-0 bg-gradient-to-t from-purple-500/5 via-transparent to-transparent pointer-events-none" />

        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center relative py-1 px-3 text-xs font-bold transition-all"
            >
              <div
                className={`transition-all duration-300 ${
                  active ? "text-purple-400 scale-110" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {item.icon}
              </div>
              <span
                className={`text-[9px] font-extrabold uppercase mt-1 tracking-wider transition-all duration-300 ${
                  active ? "text-purple-400 font-black opacity-100" : "text-zinc-600 opacity-80"
                }`}
              >
                {item.label}
              </span>

              {active && (
                <motion.div
                  layoutId="mobileNavIndicator"
                  className="absolute -bottom-1.5 h-1 w-5 rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default MobileBottomNav;
