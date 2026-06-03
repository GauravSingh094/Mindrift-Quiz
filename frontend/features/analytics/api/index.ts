import { apiClient } from "@/lib/api-client";
import { PerformanceSummary, QuizAnalyticsData, CompetitionAnalyticsData, SkillAnalyticsData, TimelineItem, AIInsightProfile, GoalMetrics } from "../types";

// Dynamic fallbacks when the backend Spring server is down (Task 18)
const mockPerformanceSummary: PerformanceSummary = {
  accuracy: 88,
  completionRate: 94,
  avgScore: 920,
  learningHours: 42,
  competitionPoints: 3800,
  globalRank: 2
};

const mockQuizAnalytics: QuizAnalyticsData = {
  quizHistory: [
    { id: "qh_1", title: "Next.js Core Architecture", score: 950, accuracy: 95, date: "2026-05-28" },
    { id: "qh_2", title: "Docker swarm basic nodes", score: 880, accuracy: 88, date: "2026-05-29" },
    { id: "qh_3", title: "Kafka Retention limits run", score: 720, accuracy: 72, date: "2026-05-31" }
  ],
  accuracyTrend: [
    { date: "May 10", value: 80 },
    { date: "May 17", value: 84 },
    { date: "May 24", value: 89 },
    { date: "May 31", value: 92 }
  ],
  timeAnalysis: [
    { quiz: "Next.js Core", you: 34, average: 48 },
    { quiz: "Docker swarm", you: 42, average: 52 },
    { quiz: "Kafka Limits", you: 55, average: 60 }
  ],
  categoryBreakdown: [
    { category: "Frontend", count: 12 },
    { category: "Backend", count: 8 },
    { category: "DevOps", count: 5 },
    { category: "AI", count: 2 }
  ]
};

const mockCompetitionAnalytics: CompetitionAnalyticsData = {
  rankHistory: [
    { date: "May 10", rank: 12 },
    { date: "May 17", rank: 8 },
    { date: "May 24", rank: 4 },
    { date: "May 31", rank: 2 }
  ],
  wins: 14,
  losses: 4,
  participations: 18,
  accuracy: 86
};

const mockSkillAnalytics: SkillAnalyticsData = {
  skills: [
    { subject: "Docker/Swarm", score: 88, average: 65 },
    { subject: "Backend API", score: 72, average: 58 },
    { subject: "System Design", score: 65, average: 52 },
    { subject: "Message Queue", score: 45, average: 60 },
    { subject: "Monitoring", score: 50, average: 61 }
  ],
  weaknesses: ["Kafka Message Retention Configurations", "Prometheus Consul Discovery", "Java Multithread Locks"],
  strengths: ["Docker Containerization", "Next.js Core Architecture", "Clerk Authentication"]
};

const mockTimeline: TimelineItem[] = [
  { id: "t_1", type: "quiz", title: "Next.js Hydration Quiz", description: "Completed with perfect 95% accuracy score.", date: "2026-05-28T12:00:00Z" },
  { id: "t_2", type: "competition", title: "Docker speed run match", description: "Placed #2 in global multiplayer arena.", date: "2026-05-29T14:30:00Z" },
  { id: "t_3", type: "achievement", title: "Continuous Streak Unlocked", description: "Logged in and completed quizzes 42 days in a row.", date: "2026-05-30T10:00:00Z" },
  { id: "t_4", type: "ai", title: "AI Learning path compiled", description: "Generated Masterclass: Container sharding path.", date: "2026-05-31T09:00:00Z" }
];

const mockInsights: AIInsightProfile = {
  learningPredictions: "Your cognitive skill distributes strongly in Swarm clustering. Maintaining consistency in Kafka segments configurations is predicted to push your global rank to #1 within 12 days.",
  growthForecasts: "Rank growth trajectory predicts reaching the ELITE Champion tier by mid-June.",
  weaknessDetection: "Alert: Message Broker limits parameters represent your largest target gap.",
  suggestions: [
    "Schedule 2 practice sandboxes on Apache Kafka retention configurations.",
    "Examine Consul Dynamic scrapers service discoveries patterns in AI Hub."
  ]
};

const mockGoals: GoalMetrics = {
  dailyProgress: 75,
  weeklyProgress: 88,
  monthlyProgress: 94
};

export async function getPerformanceSummary(): Promise<PerformanceSummary> {
  try {
    return await apiClient<PerformanceSummary>("/analytics");
  } catch (err) {
    console.warn("⚠️ API offline: Returning mock performance summary.", err);
    return mockPerformanceSummary;
  }
}

export async function getQuizAnalytics(): Promise<QuizAnalyticsData> {
  try {
    return await apiClient<QuizAnalyticsData>("/analytics/quizzes");
  } catch (err) {
    console.warn("⚠️ API offline: Returning mock quiz analytics.", err);
    return mockQuizAnalytics;
  }
}

export async function getCompetitionAnalytics(): Promise<CompetitionAnalyticsData> {
  try {
    return await apiClient<CompetitionAnalyticsData>("/analytics/competitions");
  } catch (err) {
    console.warn("⚠️ API offline: Returning mock competition analytics.", err);
    return mockCompetitionAnalytics;
  }
}

export async function getSkillAnalytics(): Promise<SkillAnalyticsData> {
  try {
    return await apiClient<SkillAnalyticsData>("/analytics/skills");
  } catch (err) {
    console.warn("⚠️ API offline: Returning mock skill analytics.", err);
    return mockSkillAnalytics;
}
}

export async function getLearningTimeline(): Promise<TimelineItem[]> {
  try {
    return await apiClient<TimelineItem[]>("/analytics/timeline");
  } catch (err) {
    console.warn("⚠️ API offline: Returning mock timeline items.", err);
    return mockTimeline;
  }
}

export async function getAIPerformanceInsights(): Promise<AIInsightProfile> {
  try {
    return await apiClient<AIInsightProfile>("/analytics/insights");
  } catch (err) {
    console.warn("⚠️ API offline: Returning mock AI Insights.", err);
    return mockInsights;
  }
}

export async function getGoalMetrics(): Promise<GoalMetrics> {
  try {
    return await apiClient<GoalMetrics>("/analytics/goals");
  } catch (err) {
    console.warn("⚠️ API offline: Returning mock goal metrics.", err);
    return mockGoals;
  }
}

export async function exportAnalyticsReport(format: "pdf" | "csv"): Promise<{ success: boolean; url: string }> {
  try {
    return await apiClient<{ success: boolean; url: string }>("/analytics/export", {
      method: "POST",
      body: JSON.stringify({ format })
    });
  } catch (err) {
    console.warn(`⚠️ API offline: Emulated export success as ${format}.`, err);
    return {
      success: true,
      url: `/exports/mindrift_report_2026.${format}`
    };
  }
}
