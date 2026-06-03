import { useAnalyticsStore } from "../features/analytics/store/analytics-store";
import { getPerformanceSummary, getQuizAnalytics, getCompetitionAnalytics, getSkillAnalytics, getLearningTimeline, getAIPerformanceInsights, getGoalMetrics, exportAnalyticsReport } from "../features/analytics/api";

describe("Mindrift F10 Analytics & Performance Intelligence Core Unit Test Suite", () => {
  beforeEach(() => {
    useAnalyticsStore.getState().clearStore();
  });

  describe("Zustand Analytics Store Management", () => {
    test("should successfully configure active filters and date ranges", () => {
      const store = useAnalyticsStore.getState();
      expect(store.dateRange).toBe("30d");
      expect(store.activeCategory).toBe("ALL");

      useAnalyticsStore.getState().setDateRange("90d");
      useAnalyticsStore.getState().setActiveCategory("DevOps");

      const updated = useAnalyticsStore.getState();
      expect(updated.dateRange).toBe("90d");
      expect(updated.activeCategory).toBe("DevOps");
    });

    test("should successfully load performance stats and goals progress into state", () => {
      const mockSummary = {
        accuracy: 88,
        completionRate: 94,
        avgScore: 920,
        learningHours: 42,
        competitionPoints: 3800,
        globalRank: 2
      };

      const mockGoals = {
        dailyProgress: 75,
        weeklyProgress: 88,
        monthlyProgress: 94
      };

      useAnalyticsStore.getState().setPerformanceSummary(mockSummary);
      useAnalyticsStore.getState().setGoals(mockGoals);

      const state = useAnalyticsStore.getState();
      expect(state.performanceSummary?.accuracy).toBe(88);
      expect(state.goals?.dailyProgress).toBe(75);
    });

    test("should load dynamic quiz and competition analytics datasets", () => {
      const mockQuizData = {
        quizHistory: [],
        accuracyTrend: [{ date: "May 10", value: 80 }],
        timeAnalysis: [],
        categoryBreakdown: []
      };

      useAnalyticsStore.getState().setQuizAnalytics(mockQuizData);

      const state = useAnalyticsStore.getState();
      expect(state.quizAnalytics?.accuracyTrend.length).toBe(1);
      expect(state.quizAnalytics?.accuracyTrend[0].value).toBe(80);
    });
  });

  describe("API Client Emulation Testing", () => {
    test("getPerformanceSummary returns active metrics payload", async () => {
      const data = await getPerformanceSummary();
      expect(data.accuracy).toBeGreaterThan(0);
      expect(data.globalRank).toBeDefined();
    });

    test("getQuizAnalytics returns trends and breakdowns maps", async () => {
      const data = await getQuizAnalytics();
      expect(data.accuracyTrend.length).toBeGreaterThan(0);
      expect(data.categoryBreakdown.length).toBeGreaterThan(0);
    });

    test("getCompetitionAnalytics returns rank standings arrays", async () => {
      const data = await getCompetitionAnalytics();
      expect(data.rankHistory.length).toBeGreaterThan(0);
      expect(data.wins).toBeGreaterThan(0);
    });

    test("getSkillAnalytics returns radar coordinates and weaknesses checklists", async () => {
      const data = await getSkillAnalytics();
      expect(data.skills.length).toBeGreaterThan(0);
      expect(data.weaknesses.length).toBeGreaterThan(0);
    });

    test("getLearningTimeline returns chronological timeline items", async () => {
      const data = await getLearningTimeline();
      expect(data.length).toBeGreaterThan(0);
      expect(data[0].type).toBeDefined();
    });

    test("getAIPerformanceInsights yields cognitive forecasts", async () => {
      const insights = await getAIPerformanceInsights();
      expect(insights.suggestions.length).toBeGreaterThan(0);
      expect(insights.learningPredictions).toBeDefined();
    });

    test("getGoalMetrics yields progress percentiles", async () => {
      const goals = await getGoalMetrics();
      expect(goals.dailyProgress).toBeGreaterThan(0);
    });

    test("exportAnalyticsReport returns secure mock download URL link", async () => {
      const report = await exportAnalyticsReport("pdf");
      expect(report.success).toBe(true);
      expect(report.url).toContain(".pdf");
    });
  });
});
