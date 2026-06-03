export interface LeaderboardUser {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  globalRank: number;
  score: number;
  accuracy: number;
  competitionPoints: number;
  achievementScore: number;
  streak: number;
  tier: "ELITE" | "DIAMOND" | "GOLD" | "SILVER" | "BRONZE";
  categoryPoints: Record<string, number>;
  categoryRanks: Record<string, number>;
  rankHistory: { date: string; rank: number }[];
}

export interface SeasonInfo {
  id: string;
  name: string;
  status: "ACTIVE" | "COMPLETED";
  points: number;
  achievementsCount: number;
  topPerformers: { name: string; score: number; rank: number }[];
}

export interface CompetitionWinner {
  competitionId: string;
  title: string;
  winnerName: string;
  winnerScore: number;
  date: string;
  participantsCount: number;
}

export interface HallOfFameRecord {
  id: string;
  name: string;
  title: string;
  achievement: string;
  season?: string;
  metricValue: string;
  avatar?: string;
}
