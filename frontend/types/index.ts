// --- API & Response Payload Contracts ---
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
  timestamp: string;
}

// --- User & RBAC Context ---
export type UserRole = 'ROLE_ADMIN' | 'ROLE_CREATOR' | 'ROLE_USER';

export interface UserProfile {
  id: string;
  clerkId: string;
  username: string;
  email: string;
  roles: UserRole[];
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

// --- Quiz & Questions Workspace ---
export type QuizDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type QuizStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface QuestionOption {
  id: string;
  optionText: string;
  isCorrect?: boolean; // Omitted on client attempts to protect integrity
}

export interface Question {
  id: string;
  questionText: string;
  points: number;
  timeLimitSeconds: number;
  options: QuestionOption[];
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  difficulty: QuizDifficulty;
  status: QuizStatus;
  creatorId: string;
  questions: Question[];
  category?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  percentage: number;
  completedAt: string;
  durationSeconds: number;
  status: 'STARTED' | 'COMPLETED' | 'EXPIRED';
}

// --- Competition & WebSockets Presence ---
export interface Competition {
  id: string;
  title: string;
  quizId: string;
  creatorId: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'ACTIVE' | 'FINISHED';
  maxParticipants: number;
}

export interface ParticipantScore {
  userId: string;
  username: string;
  score: number;
  rank: number;
  lastActiveTime: string;
}

// --- Analytics Charts & KPI Gauges ---
export interface DailyScoreMetric {
  date: string;
  quizzesCompleted: number;
  averageScore: number;
}

export interface CategoryDistribution {
  category: string;
  count: number;
  averageScore: number;
}

export interface UserAnalyticsSummary {
  userId: string;
  totalQuizzesTaken: number;
  averagePercentage: number;
  totalPointsEarned: number;
  completedDailyLearningGoal: boolean;
}
