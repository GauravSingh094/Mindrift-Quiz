"use client";

import React, { useState, useEffect } from "react";
import { getCompetitions } from "@/features/competition/api";
import { Quiz } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Trophy, Calendar, Users, Clock, ArrowRight, ShieldAlert, Sparkles, Loader2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import Link from "next/link";
import { motion } from "framer-motion";

export default function CompetitionsListingPage() {
  const { user } = useUser();
  const [competitions, setCompetitions] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  useEffect(() => {
    async function loadCompetitions() {
      setIsLoading(true);
      try {
        const data = await getCompetitions();
        setCompetitions(data);
      } catch (err) {
        toast.error("Failed to load competitions list.");
      } finally {
        setIsLoading(false);
      }
    }
    loadCompetitions();
  }, []);

  const filteredCompetitions = competitions.filter((comp) => {
    const matchesSearch = comp.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      comp.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === "ALL" || 
      comp.category?.toLowerCase() === categoryFilter.toLowerCase() ||
      comp.tags?.some(tag => tag.toLowerCase() === categoryFilter.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  const categories = ["ALL", "Frontend", "Backend", "AI", "DevOps", "Java", "Python"];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <p className="text-sm text-zinc-500 font-semibold tracking-wide animate-pulse">
          Fetching competitive lobbies...
        </p>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto max-w-7xl space-y-7 relative z-10">
      
      {/* 1. Header Title */}
      <div className="border-b border-zinc-900 pb-6">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
          Competitive Match Arenas
        </h1>
        <p className="text-xs text-zinc-500 font-semibold mt-1.5">
          Challenge global participants in real-time proctored tournaments and claim premium achievements.
        </p>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500 pointer-events-none" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search active tournaments, prize pools..."
            className="pl-11 bg-zinc-950/40 border-zinc-900 text-white placeholder-zinc-500 focus-visible:ring-purple-500 h-11 rounded-xl"
          />
        </div>

        {/* Category Toggles */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const active = categoryFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`text-[10px] font-extrabold px-3.5 py-2 rounded-xl transition-all duration-300 border uppercase tracking-wider select-none ${
                  active
                    ? "bg-purple-500/10 border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                    : "bg-zinc-950/40 border-zinc-900 text-zinc-500 hover:border-zinc-800 hover:text-zinc-300"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Listings Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCompetitions.map((comp, idx) => (
          <motion.div
            key={comp.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
          >
            <Card className="border-zinc-900 bg-zinc-950/40 backdrop-blur-xl relative overflow-hidden group hover:border-zinc-800 transition-all duration-300 flex flex-col justify-between min-h-[260px]">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/2 via-transparent to-transparent pointer-events-none" />
              
              <CardHeader className="space-y-2 pb-4">
                <div className="flex justify-between items-center w-full">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 animate-pulse">
                    Live Arena
                  </span>
                  <span className="text-[9px] font-extrabold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                    {comp.difficulty}
                  </span>
                </div>
                <CardTitle className="text-sm font-bold text-white tracking-wide group-hover:text-purple-400 transition-colors">
                  {comp.title}
                </CardTitle>
                <CardDescription className="text-xs text-zinc-500 leading-normal font-semibold truncate">
                  {comp.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pb-4">
                {/* Prize / Stats bar */}
                <div className="p-3 bg-zinc-900/40 border border-zinc-900/60 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">
                    <span>Tournament Prize Pool</span>
                    <Trophy className="h-4 w-4 text-yellow-500 animate-bounce" />
                  </div>
                  <p className="text-sm font-black text-white">5,000 XP + Speed Demon Badge</p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-wider pl-0.5">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>42 / 100 max</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>30 Minutes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Today</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-2 border-t border-zinc-900/50">
                <Button
                  asChild
                  className="w-full bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold h-10 rounded-xl gap-1.5 text-xs transition-all"
                >
                  <Link href={`/competitions/${comp.id}`}>
                    <span>Enter Lobby Page</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
