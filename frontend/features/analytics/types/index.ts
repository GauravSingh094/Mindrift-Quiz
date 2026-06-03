export interface PerformanceSummary {
  accuracy: number;
  completionRate: number;
  avgScore: number;
  learningHours: number;
  competitionPoints: number;
  globalRank: number;
}

export interface QuizHistoryRecord {
  id: string;
  title: string;
  score: number;
  accuracy: number;
  date: string;
}

export interface QuizAnalyticsData {
  quizHistory: QuizHistoryRecord[];
  accuracyTrend: { date: string; value: number }[];
  timeAnalysis: { quiz: string; you: number; average: number }[];
  categoryBreakdown: { category: string; count: number }[];
}

export interface CompetitionAnalyticsData {
  rankHistory: { date: string; rank: number }[];
  wins: number;
  losses: number;
  participations: number;
  accuracy: number;
}

export interface SkillAnalyticsData {
  skills: { subject: string; score: number; average: number }[];
  weaknesses: string[];
  strengths: string[];
}

export interface TimelineItem {
  id: string;
  type: "quiz" | "competition" | "achievement" | "ai";
  title: string;
  description: string;
  date: string;
}

export interface AIInsightProfile {
  learningPredictions: string;
  growthForecasts: string;
  weaknessDetection: string;
  suggestions: string[];
}

export interface GoalMetrics {
  dailyProgress: number;
  weeklyProgress: number;
  monthlyProgress: number;
}
