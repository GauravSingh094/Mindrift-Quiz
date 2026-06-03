"use client";

import { useEffect } from "react";
import { useLeaderboardStore } from "../store/leaderboard-store";
import { toast } from "sonner";

export function useLeaderboardWebSocket() {
  const globalLeaderboard = useLeaderboardStore((s) => s.globalLeaderboard);
  const setGlobalLeaderboard = useLeaderboardStore((s) => s.setGlobalLeaderboard);

  useEffect(() => {
    if (globalLeaderboard.length === 0) return;

    console.log("🔌 Connecting Leaderboard Real-Time Rank Syncer...");

    // Emulate random scoring events by competitors in the background (Task 11)
    const interval = setInterval(() => {
      const activeRoster = [...globalLeaderboard];
      if (activeRoster.length === 0) return;

      // Pick a random user except Arthur Dent
      const otherCompetitors = activeRoster.filter(u => u.id !== "user_demo");
      if (otherCompetitors.length === 0) return;

      const luckyUser = otherCompetitors[Math.floor(Math.random() * otherCompetitors.length)];
      const addedScore = 150 + Math.floor(Math.random() * 200);
      
      // Update their score
      const updatedRoster = activeRoster.map((u) => {
        if (u.id === luckyUser.id) {
          const nextScore = u.score + addedScore;
          return { ...u, score: nextScore };
        }
        return u;
      });

      // Sort and update rankings
      const sorted = [...updatedRoster].sort((a, b) => b.score - a.score);
      const ranked = sorted.map((u, idx) => ({ ...u, globalRank: idx + 1 }));

      setGlobalLeaderboard(ranked);

      // Random toast for immersion
      if (Math.random() > 0.6) {
        toast.info(`📢 Standing Update: '${luckyUser.name}' scored +${addedScore} XP in backend challenges!`);
      }
    }, 9000);

    return () => {
      console.log("🔌 Disconnecting Leaderboard Syncer.");
      clearInterval(interval);
    };
  }, [globalLeaderboard, setGlobalLeaderboard]);
}
