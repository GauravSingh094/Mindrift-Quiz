import { Quiz, Question, QuizAttempt } from "@/types";

export interface AntiCheatWarning {
  type: "TAB_SWITCH" | "CLIPBOARD_COPY" | "CLIPBOARD_PASTE" | "FULLSCREEN_EXIT";
  message: string;
  timestamp: string;
}

export interface QuizAttemptState {
  attemptId: string;
  quizId: string;
  currentQuestionIndex: number;
  answers: Record<string, string>; // Maps questionId -> selectedOptionId or text
  flags: Record<string, boolean>; // Maps questionId -> isFlaggedForReview
  timeRemainingSeconds: number;
  warnings: AntiCheatWarning[];
  tabSwitchesCount: number;
  copyPasteAttemptsCount: number;
  fullscreenExitsCount: number;
  isFocusModeActive: boolean;
  status: "STARTED" | "COMPLETED" | "EXPIRED";
}

export interface QuizResultDetails {
  attemptId: string;
  quizId: string;
  userId: string;
  score: number;
  percentage: number;
  accuracy: number;
  timeTakenSeconds: number;
  rank: number;
  totalParticipants: number;
  aiFeedback?: string;
  weakAreas?: string[];
  recommendations?: string[];
}
