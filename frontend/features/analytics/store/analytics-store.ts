import { create } from "zustand";
import { PerformanceSummary, QuizAnalyticsData, CompetitionAnalyticsData, SkillAnalyticsData, TimelineItem, AIInsightProfile, GoalMetrics } from "../types";

interface AnalyticsStoreState {
  dateRange: "7d" | "30d" | "90d";
  activeCategory: string;
  performanceSummary: PerformanceSummary | null;
  quizAnalytics: QuizAnalyticsData | null;
  competitionAnalytics: CompetitionAnalyticsData | null;
  skillAnalytics: SkillAnalyticsData | null;
  timeline: TimelineItem[];
  insights: AIInsightProfile | null;
  goals: GoalMetrics | null;

  setDateRange: (range: "7d" | "30d" | "90d") => void;
  setActiveCategory: (cat: string) => void;
  setPerformanceSummary: (summary: PerformanceSummary) => void;
  setQuizAnalytics: (data: QuizAnalyticsData) => void;
  setCompetitionAnalytics: (data: CompetitionAnalyticsData) => void;
  setSkillAnalytics: (data: SkillAnalyticsData) => void;
  setTimeline: (timeline: TimelineItem[]) => void;
  setInsights: (insights: AIInsightProfile) => void;
  setGoals: (goals: GoalMetrics) => void;
  clearStore: () => void;
}

export const useAnalyticsStore = create<AnalyticsStoreState>((set) => ({
  dateRange: "30d",
  activeCategory: "ALL",
  performanceSummary: null,
  quizAnalytics: null,
  competitionAnalytics: null,
  skillAnalytics: null,
  timeline: [],
  insights: null,
  goals: null,

  setDateRange: (dateRange) => set({ dateRange }),
  setActiveCategory: (activeCategory) => set({ activeCategory }),
  setPerformanceSummary: (performanceSummary) => set({ performanceSummary }),
  setQuizAnalytics: (quizAnalytics) => set({ quizAnalytics }),
  setCompetitionAnalytics: (competitionAnalytics) => set({ competitionAnalytics }),
  setSkillAnalytics: (skillAnalytics) => set({ skillAnalytics }),
  setTimeline: (timeline) => set({ timeline }),
  setInsights: (insights) => set({ insights }),
  setGoals: (goals) => set({ goals }),

  clearStore: () =>
    set({
      dateRange: "30d",
      activeCategory: "ALL",
      performanceSummary: null,
      quizAnalytics: null,
      competitionAnalytics: null,
      skillAnalytics: null,
      timeline: [],
      insights: null,
      goals: null
    })
}));

export default useAnalyticsStore;
