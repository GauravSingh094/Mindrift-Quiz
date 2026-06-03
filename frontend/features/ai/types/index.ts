import { Question } from "@/types";

export interface GeneratedQuiz {
  id: string;
  topic: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  questionCount: number;
  questions: Question[];
  createdAt: string;
}

export interface LearningPathMilestone {
  id: string;
  title: string;
  description: string;
  resources: string[];
  completed: boolean;
}

export interface LearningPath {
  id: string;
  title: string;
  topic: string;
  estimatedWeeks: number;
  milestones: LearningPathMilestone[];
  createdAt: string;
}

export interface InterviewQAPair {
  question: string;
  answer?: string;
  feedback?: string;
  score?: number; // scale of 0-100
}

export interface InterviewSession {
  id: string;
  role: string;
  difficulty: "JUNIOR" | "MID" | "SENIOR";
  status: "STARTED" | "COMPLETED";
  QA: InterviewQAPair[];
  activeQuestionIndex: number;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

export interface SkillGapProfile {
  strengths: string[];
  weaknesses: string[];
  resources: { name: string; url: string; reason: string }[];
  scores: { subject: string; score: number; average: number }[];
}

export interface AIRecommendation {
  id: string;
  type: "quiz" | "competition" | "path" | "skill";
  title: string;
  reason: string;
  url: string;
}
