import { useCompetitionStore } from "../features/competition/store/competition-store";
import { registerForCompetition, getCompetitionById, getCompetitionLeaderboard } from "../features/competition/api";
import { CompetitionWebSocketService } from "../features/competition/websocket/competition-websocket";

describe("Mindrift F7 Competition Experience Core Unit Test Suite", () => {
  beforeEach(() => {
    useCompetitionStore.getState().clearStore();
  });

  describe("Zustand Store Attempt Management", () => {
    const mockQuestions = [
      {
        id: "q_comp_1",
        questionText: "Which Docker Compose version introduced service profiles?",
        points: 100,
        options: [
          { id: "opt_1", optionText: "1.28.0" },
          { id: "opt_2", optionText: "3.9" }
        ]
      }
    ];

    test("should initialize competition attempt state with full defaults", () => {
      useCompetitionStore.getState().startAttempt({
        attemptId: "attempt_test_99",
        quizId: "competition-1",
        questions: mockQuestions,
        timeLimitSeconds: 300
      });

      const state = useCompetitionStore.getState();
      expect(state.attemptId).toBe("attempt_test_99");
      expect(state.quizId).toBe("competition-1");
      expect(state.questions.length).toBe(1);
      expect(state.timeRemainingSeconds).toBe(300);
      expect(state.status).toBe("LIVE");
      expect(state.warningsCount).toBe(0);
      expect(state.tabSwitchesCount).toBe(0);
    });

    test("should correctly save user option answers", () => {
      useCompetitionStore.getState().startAttempt({
        attemptId: "attempt_test_99",
        quizId: "competition-1",
        questions: mockQuestions,
        timeLimitSeconds: 300
      });

      useCompetitionStore.getState().answerQuestion("q_comp_1", "opt_1");
      
      const state = useCompetitionStore.getState();
      expect(state.answers["q_comp_1"]).toBe("opt_1");
    });

    test("should toggle review flags cleanly", () => {
      useCompetitionStore.getState().startAttempt({
        attemptId: "attempt_test_99",
        quizId: "competition-1",
        questions: mockQuestions,
        timeLimitSeconds: 300
      });

      expect(useCompetitionStore.getState().flags["q_comp_1"]).toBeUndefined();

      useCompetitionStore.getState().toggleFlag("q_comp_1");
      expect(useCompetitionStore.getState().flags["q_comp_1"]).toBe(true);

      useCompetitionStore.getState().toggleFlag("q_comp_1");
      expect(useCompetitionStore.getState().flags["q_comp_1"]).toBe(false);
    });

    test("should register correct integrity violation logs and warning counts", () => {
      useCompetitionStore.getState().startAttempt({
        attemptId: "attempt_test_99",
        quizId: "competition-1",
        questions: mockQuestions,
        timeLimitSeconds: 300
      });

      useCompetitionStore.getState().addWarning("TAB_SWITCH", "User tab blur.");
      useCompetitionStore.getState().addWarning("COPY_PASTE", "Clipboard paste blocked.");
      useCompetitionStore.getState().addWarning("FULLSCREEN_EXIT", "User exited fullscreen.");

      const state = useCompetitionStore.getState();
      expect(state.warningsCount).toBe(3);
      expect(state.tabSwitchesCount).toBe(1);
      expect(state.copyPasteAttemptsCount).toBe(1);
      expect(state.fullscreenExitsCount).toBe(1);
    });

    test("should decrement timer limit and transition status on expiration", () => {
      useCompetitionStore.getState().startAttempt({
        attemptId: "attempt_test_99",
        quizId: "competition-1",
        questions: mockQuestions,
        timeLimitSeconds: 2
      });

      useCompetitionStore.getState().tickTimer();
      expect(useCompetitionStore.getState().timeRemainingSeconds).toBe(1);
      expect(useCompetitionStore.getState().status).toBe("LIVE");

      useCompetitionStore.getState().tickTimer();
      expect(useCompetitionStore.getState().timeRemainingSeconds).toBe(0);
      expect(useCompetitionStore.getState().status).toBe("TIME_OUT");
    });

    test("should transition status on early submission complete", () => {
      useCompetitionStore.getState().startAttempt({
        attemptId: "attempt_test_99",
        quizId: "competition-1",
        questions: mockQuestions,
        timeLimitSeconds: 300
      });

      useCompetitionStore.getState().completeAttempt();
      expect(useCompetitionStore.getState().status).toBe("SUBMITTED");
    });
  });

  describe("API Client Emulation Testing", () => {
    test("registerForCompetition returns success", async () => {
      const res = await registerForCompetition("competition-1");
      expect(res.success).toBe(true);
    });

    test("getCompetitionById returns mock details if API offline", async () => {
      const quiz = await getCompetitionById("competition-1");
      expect(quiz).toBeDefined();
      expect(quiz.id).toBe("competition-1");
    });

    test("getCompetitionLeaderboard returns sorted rosters", async () => {
      const leaderboard = await getCompetitionLeaderboard("competition-1");
      expect(leaderboard.length).toBeGreaterThan(0);
      // ranks should match sorting
      expect(leaderboard[0].score).toBeGreaterThanOrEqual(leaderboard[1].score);
    });
  });

  describe("WebSocket Presence Client Emulation Testing", () => {
    test("should verify WebSocket emulator presence connect status", () => {
      CompetitionWebSocketService.connect("competition-1", "user_demo", "Arthur Dent");
      const state = useCompetitionStore.getState();
      expect(state.socketConnected).toBe(true);
      expect(state.announcements.length).toBeGreaterThan(0);
      
      CompetitionWebSocketService.disconnect();
      const stateAfter = useCompetitionStore.getState();
      expect(stateAfter.socketConnected).toBe(false);
    });
  });
});
