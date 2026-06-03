import { Quiz, Question } from "@/types";

export interface CompetitionParticipant {
  userId: string;
  name: string;
  avatar?: string;
  score: number;
  questionsAnswered: number;
  rank: number;
  timeSpentSeconds: number;
  isActive: boolean;
}

export interface CompetitionLobby {
  competitionId: string;
  title: string;
  startTime: string;
  durationMinutes: number;
  registeredCount: number;
  maxParticipants: number;
  announcements: string[];
  participants: { userId: string; name: string; avatar?: string; ready: boolean }[];
  status: "UPCOMING" | "LIVE" | "COMPLETED";
}

export interface CompetitionIntegrityEvent {
  userId: string;
  userName: string;
  type: "TAB_SWITCH" | "COPY_PASTE" | "FULLSCREEN_EXIT";
  timestamp: string;
}

export interface CompetitionHistoryItem {
  id: string;
  title: string;
  category: string;
  rank: number;
  totalParticipants: number;
  score: number;
  accuracy: number;
  date: string;
  certificateUrl?: string;
  badgeUnlocked?: string;
}
