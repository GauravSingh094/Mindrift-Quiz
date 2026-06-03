import { apiClient } from "@/lib/api-client";
import { Quiz, QuizAttempt } from "@/types";
import { CompetitionParticipant, CompetitionLobby, CompetitionHistoryItem } from "../types";
import { mockQuizzes } from "@/lib/mock-data";

// Falling back mock data rosters
const mockCompetitionsList: Quiz[] = mockQuizzes.filter((q) => q.isCompetition) as unknown as Quiz[];

const mockLobbyDetails: Record<string, CompetitionLobby> = {
  "competition-1": {
    competitionId: "competition-1",
    title: "Docker Orchestration Speed Run",
    startTime: new Date(Date.now() + 120 * 1000).toISOString(), // 2 minutes from now
    durationMinutes: 45,
    registeredCount: 42,
    maxParticipants: 100,
    announcements: [
      "Lobby is filling up rapidly. Review your container compose commands.",
      "Competition starting in 2 minutes. Good luck!",
    ],
    participants: [
      { userId: "1", name: "Sarah Connor", ready: true },
      { userId: "2", name: "Gaurav Singh", ready: true },
      { userId: "3", name: "Alex Mercer", ready: true },
      { userId: "4", name: "You (Arthur Dent)", ready: true },
    ],
    status: "UPCOMING",
  },
};

const mockLeaderboard: Record<string, CompetitionParticipant[]> = {
  "competition-1": [
    { userId: "1", name: "Sarah Connor", score: 950, questionsAnswered: 10, rank: 1, timeSpentSeconds: 240, isActive: true },
    { userId: "2", name: "Gaurav Singh", score: 880, questionsAnswered: 9, rank: 2, timeSpentSeconds: 260, isActive: true },
    { userId: "3", name: "Alex Mercer", score: 850, questionsAnswered: 9, rank: 3, timeSpentSeconds: 280, isActive: true },
    { userId: "user_demo", name: "Arthur Dent (You)", score: 920, questionsAnswered: 10, rank: 2, timeSpentSeconds: 250, isActive: true },
  ],
};

export async function getCompetitions(): Promise<Quiz[]> {
  try {
    return await apiClient<Quiz[]>("/competitions");
  } catch (err) {
    console.warn("⚠️ API offline: Returning mock competitions list.", err);
    return mockCompetitionsList;
  }
}

export async function getCompetitionById(id: string): Promise<Quiz> {
  try {
    return await apiClient<Quiz>(`/competitions/${id}`);
  } catch (err) {
    console.warn(`⚠️ API offline: Returning mock details for competition ${id}.`, err);
    const found = mockQuizzes.find((q) => q.id === id) || {
      id: id,
      title: "Emulated Competition Match",
      category: "DevOps",
      isCompetition: true,
      questions: []
    };
    return found as unknown as Quiz;
  }
}

export async function registerForCompetition(id: string): Promise<{ success: boolean }> {
  try {
    return await apiClient<{ success: boolean }>(`/competitions/${id}/register`, {
      method: "POST",
    });
  } catch (err) {
    console.warn(`⚠️ API offline: Emulated success registration for competition ${id}.`, err);
    return { success: true };
  }
}

export async function joinCompetitionLobby(id: string): Promise<CompetitionLobby> {
  try {
    return await apiClient<CompetitionLobby>(`/competitions/${id}/join`, {
      method: "POST",
    });
  } catch (err) {
    console.warn(`⚠️ API offline: Emulated success join lobby for competition ${id}.`, err);
    return mockLobbyDetails[id] || {
      competitionId: id,
      title: "Active Competition Arena Lobbies",
      startTime: new Date(Date.now() + 60 * 1000).toISOString(),
      durationMinutes: 30,
      registeredCount: 15,
      maxParticipants: 50,
      announcements: ["Welcome to local match lobby."],
      participants: [{ userId: "user_demo", name: "Arthur Dent", ready: true }],
      status: "UPCOMING",
    };
  }
}

export async function getCompetitionLeaderboard(id: string): Promise<CompetitionParticipant[]> {
  try {
    return await apiClient<CompetitionParticipant[]>(`/competitions/${id}/leaderboard`);
  } catch (err) {
    console.warn(`⚠️ API offline: Emulated leaderboard for competition ${id}.`, err);
    return mockLeaderboard[id] || [];
  }
}

export async function getCompetitionHistory(): Promise<CompetitionHistoryItem[]> {
  try {
    return await apiClient<CompetitionHistoryItem[]>("/competitions/history");
  } catch (err) {
    console.warn("⚠️ API offline: Emulated history lists.", err);
    return [
      {
        id: "comp_hist_1",
        title: "Docker Speed Run 2026",
        category: "DevOps",
        rank: 4,
        totalParticipants: 85,
        score: 920,
        accuracy: 92,
        date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
        certificateUrl: "/certificates/docker_speed_run_2026.pdf",
        badgeUnlocked: "Speed Demon",
      },
      {
        id: "comp_hist_2",
        title: "Java Multi-Threading Hackathon",
        category: "Java Performance",
        rank: 12,
        totalParticipants: 150,
        score: 780,
        accuracy: 78,
        date: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
        certificateUrl: "/certificates/jvm_multithread_2026.pdf",
        badgeUnlocked: "JVM Architect",
      },
    ];
  }
}
