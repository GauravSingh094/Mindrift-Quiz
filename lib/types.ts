// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

// Quiz Types
export interface Quiz {
  id: string;
  title: string;
  description: string;
  categories: Category[];
  difficulty: Difficulty;
  timePerQuestion: number; // in seconds
  isLive: boolean;
  startTime: Date;
  endTime?: Date;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  questionCount: number;
  maxParticipants: number;
  currentParticipants: number;
  status: QuizStatus;
  quizCode?: string; // Add quiz code field for joining
  isCompetition?: boolean; // New: Mark as competition quiz
  registeredParticipants?: string[]; // New: Pre-registered participant IDs
}

export interface Question {
  id: string;
  quizId: string;
  text: string;
  options: Option[];
  correctOptionId: string;
  points: number;
  timeLimit?: number; // in seconds, override quiz default if set
  explanation?: string;
  imageUrl?: string;
  createdAt?: Date;
}

export interface Option {
  id: string;
  text: string;
}

export interface UserAnswer {
  id: string;
  userId: string;
  questionId: string;
  optionId: string;
  isCorrect: boolean;
  timeToAnswer: number; // in seconds
  createdAt: Date;
}

export interface QuizResult {
  id: string;
  userId: string;
  quizId: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  completedAt: Date;
  timeSpent: number; // in seconds
}

export interface LeaderboardEntry {
  user: {
    id: string;
    name: string;
    image?: string;
  };
  score: number;
  rank: number;
  timeSpent: number;
}

// Competition Types
export interface Competition {
  id?: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  scheduledAt: Date;
  duration: number;
  totalQuestions: number;
  maxParticipants: number;
  instructions?: string;
  competitionCode: string;
  antiCheat: {
    copyPasteLock: boolean;
    tabSwitchLimit: number;
    cooldownPeriod: number;
  };
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  currentParticipants: number;
  createdAt?: Date;
  createdBy: string;
}

export interface RegisteredParticipant {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  registeredAt: Date;
  quizId: string;
}

export interface KickedUser {
  userId: string;
  quizId: string;
  kickedAt: Date;
  kickedBy: string;
  reason?: string;
}

export interface LiveParticipant {
  userId: string;
  name: string;
  email: string;
  joinedAt: Date;
  currentScore: number;
  questionsAnswered: number;
  isActive: boolean;
}

export interface CompetitionLeaderboard {
  userId: string;
  name: string;
  score: number;
  timeSpent: number;
  rank: number;
  updatedAt: Date;
}

// Enums
export type Category = 
  | 'c'
  | 'cpp'
  | 'java'
  | 'python'
  | 'javascript'
  | 'typescript'
  | 'mysql'
  | 'mongodb'
  | 'react'
  | 'node'
  | 'angular'
  | 'vue'
  | 'docker'
  | 'kubernetes'
  | 'aws'
  | 'azure'
  | 'devops';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export type QuizStatus = 'created' | 'scheduled' | 'active' | 'live' | 'completed' | 'cancelled';

// State Types
export interface QuizState {
  currentQuestionIndex: number;
  answers: Record<string, string>; // questionId -> selectedOptionId
  timeRemaining: number;
  isSubmitted: boolean;
}