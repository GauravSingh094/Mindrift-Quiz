import { create } from "zustand";
import { LeaderboardUser, SeasonInfo, CompetitionWinner, HallOfFameRecord } from "../types";

interface LeaderboardStoreState {
  // Filters & Page Configuration
  activeFilter: "global" | "category" | "season" | "competition" | "achievement";
  activeCategory: string;

  // Standings data
  globalLeaderboard: LeaderboardUser[];
  seasons: SeasonInfo[];
  competitionRankings: CompetitionWinner[];
  hallOfFame: HallOfFameRecord[];

  // Comparison drawer state
  comparisonUserA: LeaderboardUser | null;
  comparisonUserB: LeaderboardUser | null;

  // Actions
  setActiveFilter: (filter: "global" | "category" | "season" | "competition" | "achievement") => void;
  setActiveCategory: (cat: string) => void;
  setGlobalLeaderboard: (leaderboard: LeaderboardUser[]) => void;
  setSeasons: (seasons: SeasonInfo[]) => void;
  setCompetitionRankings: (rankings: CompetitionWinner[]) => void;
  setHallOfFame: (records: HallOfFameRecord[]) => void;
  
  setComparisonUser: (slot: "A" | "B", user: LeaderboardUser | null) => void;
  updateUserScore: (userId: string, addedScore: number, accuracy: number) => void;
  
  clearStore: () => void;
}

export const useLeaderboardStore = create<LeaderboardStoreState>((set) => ({
  activeFilter: "global",
  activeCategory: "ALL",
  globalLeaderboard: [],
  seasons: [],
  competitionRankings: [],
  hallOfFame: [],
  comparisonUserA: null,
  comparisonUserB: null,

  setActiveFilter: (activeFilter) => set({ activeFilter }),
  setActiveCategory: (activeCategory) => set({ activeCategory }),
  
  setGlobalLeaderboard: (globalLeaderboard) => 
    set({ 
      globalLeaderboard: [...globalLeaderboard].sort((a, b) => b.score - a.score) 
    }),

  setSeasons: (seasons) => set({ seasons }),
  setCompetitionRankings: (competitionRankings) => set({ competitionRankings }),
  setHallOfFame: (hallOfFame) => set({ hallOfFame }),

  setComparisonUser: (slot, user) => 
    set((state) => ({
      [slot === "A" ? "comparisonUserA" : "comparisonUserB"]: user
    })),

  updateUserScore: (userId, addedScore, accuracy) =>
    set((state) => {
      const updated = state.globalLeaderboard.map((user) => {
        if (user.id === userId) {
          const nextScore = user.score + addedScore;
          return { ...user, score: nextScore, accuracy };
        }
        return user;
      });

      // Sort and recalculate ranks
      const sorted = [...updated].sort((a, b) => b.score - a.score);
      const ranked = sorted.map((u, idx) => ({ ...u, globalRank: idx + 1 }));

      return { globalLeaderboard: ranked };
    }),

  clearStore: () =>
    set({
      activeFilter: "global",
      activeCategory: "ALL",
      globalLeaderboard: [],
      seasons: [],
      competitionRankings: [],
      hallOfFame: [],
      comparisonUserA: null,
      comparisonUserB: null,
    }),
}));

export default useLeaderboardStore;
