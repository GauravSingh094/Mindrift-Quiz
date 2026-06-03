import { apiClient } from "@/lib/api-client";
import { LeaderboardUser, SeasonInfo, CompetitionWinner, HallOfFameRecord } from "../types";

// Roster of mock users (Task 18 fallbacks)
const mockGlobalLeaderboard: LeaderboardUser[] = [
  {
    id: "user-1",
    name: "Sarah Connor",
    username: "terminator_slayer",
    globalRank: 1,
    score: 9850,
    accuracy: 94,
    competitionPoints: 4200,
    achievementScore: 1200,
    streak: 45,
    tier: "ELITE",
    categoryPoints: { Frontend: 3500, Backend: 4000, AI: 2350, DevOps: 0 },
    categoryRanks: { Frontend: 2, Backend: 1, AI: 3 },
    rankHistory: [
      { date: "May 10", rank: 5 },
      { date: "May 17", rank: 3 },
      { date: "May 24", rank: 2 },
      { date: "May 31", rank: 1 }
    ]
  },
  {
    id: "user_demo",
    name: "Arthur Dent",
    username: "arthur_dent",
    globalRank: 2,
    score: 9240,
    accuracy: 92,
    competitionPoints: 3800,
    achievementScore: 1100,
    streak: 42,
    tier: "ELITE",
    categoryPoints: { Frontend: 3800, Backend: 3200, AI: 1200, DevOps: 1040 },
    categoryRanks: { Frontend: 1, Backend: 4, AI: 12, DevOps: 2 },
    rankHistory: [
      { date: "May 10", rank: 10 },
      { date: "May 17", rank: 6 },
      { date: "May 24", rank: 4 },
      { date: "May 31", rank: 2 }
    ]
  },
  {
    id: "user-2",
    name: "Gaurav Singh",
    username: "singh_star",
    globalRank: 3,
    score: 8720,
    accuracy: 89,
    competitionPoints: 3500,
    achievementScore: 950,
    streak: 30,
    tier: "DIAMOND",
    categoryPoints: { Frontend: 3000, Backend: 3800, AI: 920, DevOps: 1000 },
    categoryRanks: { Frontend: 4, Backend: 2, AI: 15, DevOps: 3 },
    rankHistory: [
      { date: "May 10", rank: 4 },
      { date: "May 17", rank: 4 },
      { date: "May 24", rank: 3 },
      { date: "May 31", rank: 3 }
    ]
  },
  {
    id: "user-3",
    name: "Alex Mercer",
    username: "prototype_x",
    globalRank: 4,
    score: 8580,
    accuracy: 85,
    competitionPoints: 3100,
    achievementScore: 920,
    streak: 28,
    tier: "DIAMOND",
    categoryPoints: { Frontend: 2500, Backend: 3500, AI: 2580, DevOps: 0 },
    categoryRanks: { Frontend: 6, Backend: 3, AI: 1 },
    rankHistory: [
      { date: "May 10", rank: 2 },
      { date: "May 17", rank: 2 },
      { date: "May 24", rank: 5 },
      { date: "May 31", rank: 4 }
    ]
  },
  {
    id: "user-4",
    name: "Ford Prefect",
    username: "guide_editor",
    globalRank: 5,
    score: 7490,
    accuracy: 88,
    competitionPoints: 2400,
    achievementScore: 820,
    streak: 15,
    tier: "GOLD",
    categoryPoints: { Frontend: 2100, Backend: 3000, AI: 1500, DevOps: 890 },
    categoryRanks: { Frontend: 8, Backend: 5, AI: 9, DevOps: 5 },
    rankHistory: [
      { date: "May 10", rank: 8 },
      { date: "May 17", rank: 7 },
      { date: "May 24", rank: 6 },
      { date: "May 31", rank: 5 }
    ]
  },
  {
    id: "user-5",
    name: "Trillian Astra",
    username: "trill_star",
    globalRank: 6,
    score: 7320,
    accuracy: 91,
    competitionPoints: 2200,
    achievementScore: 800,
    streak: 24,
    tier: "GOLD",
    categoryPoints: { Frontend: 2800, Backend: 2500, AI: 2020, DevOps: 0 },
    categoryRanks: { Frontend: 5, Backend: 8, AI: 4 },
    rankHistory: [
      { date: "May 10", rank: 3 },
      { date: "May 17", rank: 5 },
      { date: "May 24", rank: 7 },
      { date: "May 31", rank: 6 }
    ]
  },
  {
    id: "user-6",
    name: "Zaphod Beeblebrox",
    username: "president_two",
    globalRank: 7,
    score: 6250,
    accuracy: 83,
    competitionPoints: 1800,
    achievementScore: 650,
    streak: 10,
    tier: "SILVER",
    categoryPoints: { Frontend: 1500, Backend: 1500, AI: 1250, DevOps: 2000 },
    categoryRanks: { Frontend: 15, Backend: 15, AI: 11, DevOps: 1 },
    rankHistory: [
      { date: "May 10", rank: 1 },
      { date: "May 17", rank: 1 },
      { date: "May 24", rank: 1 },
      { date: "May 31", rank: 7 }
    ]
  }
];

const mockSeasons: SeasonInfo[] = [
  {
    id: "season-1",
    name: "Season 1: Container Orchestration",
    status: "ACTIVE",
    points: 4200,
    achievementsCount: 3,
    topPerformers: [
      { name: "Sarah Connor", score: 4500, rank: 1 },
      { name: "Arthur Dent", score: 4100, rank: 2 },
      { name: "Gaurav Singh", score: 3800, rank: 3 }
    ]
  },
  {
    id: "season-0",
    name: "Alpha Pre-Season: Foundations",
    status: "COMPLETED",
    points: 5040,
    achievementsCount: 5,
    topPerformers: [
      { name: "Zaphod Beeblebrox", score: 6250, rank: 1 },
      { name: "Alex Mercer", score: 5500, rank: 2 },
      { name: "Trillian Astra", score: 5200, rank: 3 }
    ]
  }
];

const mockCompetitions: CompetitionWinner[] = [
  {
    competitionId: "comp-speed-1",
    title: "Docker Orchestration Speed Run",
    winnerName: "Sarah Connor",
    winnerScore: 1050,
    date: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    participantsCount: 85
  },
  {
    competitionId: "comp-speed-2",
    title: "Java Multi-Threading Hackathon",
    winnerName: "Alex Mercer",
    winnerScore: 1200,
    date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    participantsCount: 150
  }
];

const mockHallOfFame: HallOfFameRecord[] = [
  {
    id: "hof-1",
    name: "Sarah Connor",
    title: "Orchestration Queen",
    achievement: "First place in Season 1 Container Competitions",
    season: "Season 1",
    metricValue: "4,500 seasonal XP",
    avatar: "https://i.pravatar.cc/150?img=1"
  },
  {
    id: "hof-2",
    name: "Zaphod Beeblebrox",
    title: "Historic Alpha Champion",
    achievement: "Champion of Alpha Pre-Season Foundations",
    season: "Alpha Season",
    metricValue: "6,250 historic XP",
    avatar: "https://i.pravatar.cc/150?img=6"
  },
  {
    id: "hof-3",
    name: "Arthur Dent",
    title: "Infinite Streak Legend",
    achievement: "Held the longest daily continuous activity streak",
    metricValue: "42 active days streak",
    avatar: "https://i.pravatar.cc/150?img=4"
  }
];

export async function getGlobalLeaderboard(): Promise<LeaderboardUser[]> {
  try {
    return await apiClient<LeaderboardUser[]>("/leaderboards/global");
  } catch (err) {
    console.warn("⚠️ API offline: Returning mock global leaderboard.", err);
    return mockGlobalLeaderboard;
  }
}

export async function getLeaderboardSeasons(): Promise<SeasonInfo[]> {
  try {
    return await apiClient<SeasonInfo[]>("/leaderboards/seasons");
  } catch (err) {
    console.warn("⚠️ API offline: Returning mock seasons history.", err);
    return mockSeasons;
  }
}

export async function getCompetitionWinners(): Promise<CompetitionWinner[]> {
  try {
    return await apiClient<CompetitionWinner[]>("/leaderboards/competitions");
  } catch (err) {
    console.warn("⚠️ API offline: Returning mock competition winners.", err);
    return mockCompetitions;
  }
}

export async function getHallOfFame(): Promise<HallOfFameRecord[]> {
  try {
    return await apiClient<HallOfFameRecord[]>("/leaderboards/hall-of-fame");
  } catch (err) {
    console.warn("⚠️ API offline: Returning mock hall of fame.", err);
    return mockHallOfFame;
  }
}

export async function getUserRankProfile(id: string): Promise<LeaderboardUser> {
  try {
    return await apiClient<LeaderboardUser>(`/leaderboards/users/${id}`);
  } catch (err) {
    console.warn(`⚠️ API offline: Returning mock user profile for ${id}.`, err);
    const found = mockGlobalLeaderboard.find((u) => u.id === id);
    if (!found) {
      // return default mock fallback user
      return mockGlobalLeaderboard[1];
    }
    return found;
  }
}
