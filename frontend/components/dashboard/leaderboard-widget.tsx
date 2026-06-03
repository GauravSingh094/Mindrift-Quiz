"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Trophy, Medal, ArrowRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface LeaderboardUser {
  rank: number;
  name: string;
  points: number;
  isCurrentUser?: boolean;
}

const mockTopPerformers: LeaderboardUser[] = [
  { rank: 1, name: "Sarah Connor", points: 8400 },
  { rank: 2, name: "Gaurav Singh", points: 7200 },
  { rank: 3, name: "Alex Mercer", points: 6850 },
  { rank: 12, name: "You (Arthur Dent)", points: 3450, isCurrentUser: true },
];

export function LeaderboardWidget() {
  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Medal className="h-5 w-5 text-yellow-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-zinc-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-xs font-bold text-zinc-500 w-5 text-center">{rank}</span>;
    }
  };

  return (
    <Card className="border-zinc-900 bg-zinc-950/40 backdrop-blur-xl shadow-2xl relative overflow-hidden h-full">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/2 via-transparent to-transparent pointer-events-none" />

      <CardHeader className="pb-4 border-b border-zinc-900/50">
        <CardTitle className="text-base font-black tracking-tight text-white flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <span>Top Performers</span>
        </CardTitle>
        <CardDescription className="text-[11px] text-zinc-500 font-semibold mt-0.5">
          Global rankings of active platform contributors.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-5 space-y-3">
        {mockTopPerformers.map((user) => (
          <div
            key={user.rank}
            className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
              user.isCurrentUser
                ? "bg-purple-500/5 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.05)]"
                : "bg-zinc-900/10 border-zinc-900 hover:border-zinc-800"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8">
                {getRankBadge(user.rank)}
              </div>
              
              <Avatar className="h-8 w-8 border border-zinc-800">
                <AvatarFallback className="bg-zinc-900 text-zinc-400 text-xs font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div>
                <h4 className={`text-xs font-bold tracking-wide ${
                  user.isCurrentUser ? "text-purple-400" : "text-white"
                }`}>
                  {user.name}
                </h4>
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
                  {user.isCurrentUser ? "Ranked Globally" : `Rank ${user.rank}`}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-extrabold text-white tracking-tight">
                {user.points.toLocaleString()}
              </span>
              <span className="text-[9px] text-zinc-500 block font-bold uppercase">XP</span>
            </div>
          </div>
        ))}
      </CardContent>

      <CardFooter className="pt-2 border-t border-zinc-900/50">
        <Button
          asChild
          variant="ghost"
          className="w-full text-zinc-500 hover:text-zinc-300 font-bold h-9 text-xs gap-1"
        >
          <Link href="/leaderboard">
            <span>View Full Leaderboards</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default LeaderboardWidget;
