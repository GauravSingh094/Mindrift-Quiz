"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Clock, Users, Flame, ArrowRight } from "lucide-react";
import { EmptyState } from "./empty-state";
import { motion } from "framer-motion";
import Link from "next/link";

interface CompetitionItem {
  id: string;
  title: string;
  category: string;
  maxParticipants: number;
  participantsCount: number;
  status: "ACTIVE" | "UPCOMING" | "REGISTERED";
  startsInSeconds: number; // For timers
}

const mockCompetitions: CompetitionItem[] = [
  {
    id: "comp_1",
    title: "Docker Orchestration Speed Run",
    category: "DevOps",
    maxParticipants: 100,
    participantsCount: 42,
    status: "ACTIVE",
    startsInSeconds: 0,
  },
  {
    id: "comp_2",
    title: "High Performance JVM Tuning",
    category: "Java Performance",
    maxParticipants: 50,
    participantsCount: 18,
    status: "REGISTERED",
    startsInSeconds: 1540, // 25 mins
  },
  {
    id: "comp_3",
    title: "React Server Components Architecture",
    category: "Frontend",
    maxParticipants: 200,
    participantsCount: 88,
    status: "UPCOMING",
    startsInSeconds: 7200, // 2 hours
  },
];

export function CompetitionsWidget() {
  const [competitions, setCompetitions] = useState<CompetitionItem[]>(mockCompetitions);

  // Tick countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCompetitions((prev) =>
        prev.map((c) =>
          c.startsInSeconds > 0
            ? { ...c, startsInSeconds: c.startsInSeconds - 1 }
            : c
        )
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (seconds: number) => {
    if (seconds <= 0) return "In Progress";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m ${secs}s`;
  };

  if (competitions.length === 0) {
    return (
      <EmptyState
        title="No Live Arenas"
        description="Scheduled competitions and active multiplayer lobbies appear here."
        icon={Trophy}
        actionText="Browse schedule"
        onActionClick={() => {}}
      />
    );
  }

  return (
    <Card className="border-zinc-900 bg-zinc-950/40 backdrop-blur-xl shadow-2xl relative overflow-hidden h-full">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/2 via-transparent to-transparent pointer-events-none" />

      <CardHeader className="pb-4 border-b border-zinc-900/50">
        <CardTitle className="text-base font-black tracking-tight text-white flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <span>Competitive Lobbies</span>
        </CardTitle>
        <CardDescription className="text-[11px] text-zinc-500 font-semibold mt-0.5">
          Join multiplayer arenas and claim top ranks.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-5 space-y-4">
        {competitions.map((comp) => {
          const isActive = comp.status === "ACTIVE" || comp.startsInSeconds <= 0;
          return (
            <div
              key={comp.id}
              className={`p-4 border rounded-2xl transition-all duration-300 relative overflow-hidden ${
                isActive
                  ? "bg-purple-950/5 border-purple-500/30 hover:border-purple-500/50"
                  : "bg-zinc-900/10 border-zinc-900 hover:border-zinc-800"
              }`}
            >
              {/* Inner ambient card glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/1 to-transparent pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3 relative z-10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white tracking-wide">
                      {comp.title}
                    </h4>
                    <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      isActive
                        ? "bg-purple-500/15 text-purple-400 border border-purple-500/20 animate-pulse"
                        : comp.status === "REGISTERED"
                        ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20"
                        : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                    }`}>
                      {isActive ? "LIVE" : comp.status === "REGISTERED" ? "REGISTERED" : "UPCOMING"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                    <span>{comp.category}</span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      <span>{comp.participantsCount}/{comp.maxParticipants}</span>
                    </span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-end gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400">
                    <Clock className="h-4 w-4 text-zinc-500" />
                    <span className={isActive ? "text-purple-400 font-bold" : ""}>
                      {formatCountdown(comp.startsInSeconds)}
                    </span>
                  </div>
                  
                  <Button
                    asChild
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    className={`h-8 rounded-xl font-bold px-4 text-xs transition-all w-full sm:w-auto ${
                      isActive
                        ? "bg-purple-600 hover:bg-purple-500 text-white"
                        : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Link href={`/admin/competitions/join`}>
                      {isActive ? "Battle Now" : "Register"}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
      
      <CardFooter className="pt-2 border-t border-zinc-900/50">
        <Button
          asChild
          variant="ghost"
          className="w-full text-zinc-500 hover:text-zinc-300 font-bold h-9 text-xs gap-1"
        >
          <Link href="/admin/competitions">
            <span>Browse Lobbies Calendar</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default CompetitionsWidget;
