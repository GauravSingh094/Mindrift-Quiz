import { useQuizStore } from "../features/quiz/store/quiz-store";
import { normalizeRole } from "../lib/auth-utils";

describe("Mindrift flagship Quiz Arena Store & Logic Test Suite", () => {
  beforeEach(() => {
    useQuizStore.getState().clearStore();
  });

  describe("Task 18: Zustand Quiz Attempt Store Tests", () => {
    const mockQuestions = [
      {
        id: "q_1",
        questionText: "What is Suspense hydration priority in React 18?",
        points: 100,
        timeLimitSeconds: 90,
        options: [
          { id: "o_1", optionText: "High", isCorrect: true },
          { id: "o_2", optionText: "Low", isCorrect: false },
        ],
      },
      {
        id: "q_2",
        questionText: "Does Spring Security JWT use symmetric verification?",
        points: 100,
        timeLimitSeconds: 90,
        options: [
          { id: "o_3", optionText: "Yes", isCorrect: true },
          { id: "o_4", optionText: "No", isCorrect: false },
        ],
      },
    ];

    test("should successfully initialize attempt details and questions", () => {
      useQuizStore.getState().startAttempt({
        attemptId: "att_test_100",
        quizId: "quiz_test_1",
        questions: mockQuestions,
        timeLimitSeconds: 180,
      });

      const state = useQuizStore.getState();
      expect(state.attemptId).toBe("att_test_100");
      expect(state.quizId).toBe("quiz_test_1");
      expect(state.questions.length).toBe(2);
      expect(state.timeRemainingSeconds).toBe(180);
      expect(state.currentQuestionIndex).toBe(0);
      expect(state.status).toBe("STARTED");
    });

    test("should mutate answers and preserve selections", () => {
      useQuizStore.getState().startAttempt({
        attemptId: "att_test_100",
        quizId: "quiz_test_1",
        questions: mockQuestions,
        timeLimitSeconds: 180,
      });

      useQuizStore.getState().answerQuestion("q_1", "o_1");
      expect(useQuizStore.getState().answers["q_1"]).toBe("o_1");

      useQuizStore.getState().answerQuestion("q_2", "o_3");
      expect(useQuizStore.getState().answers["q_2"]).toBe("o_3");
    });

    test("should toggle review flag on questions", () => {
      useQuizStore.getState().startAttempt({
        attemptId: "att_test_100",
        quizId: "quiz_test_1",
        questions: mockQuestions,
        timeLimitSeconds: 180,
      });

      expect(useQuizStore.getState().flags["q_1"]).toBeUndefined();
      
      useQuizStore.getState().toggleFlag("q_1");
      expect(useQuizStore.getState().flags["q_1"]).toBe(true);

      useQuizStore.getState().toggleFlag("q_1");
      expect(useQuizStore.getState().flags["q_1"]).toBe(false);
    });

    test("should decrement timer and trigger expired status", () => {
      useQuizStore.getState().startAttempt({
        attemptId: "att_test_100",
        quizId: "quiz_test_1",
        questions: mockQuestions,
        timeLimitSeconds: 2,
      });

      useQuizStore.getState().tickTimer();
      expect(useQuizStore.getState().timeRemainingSeconds).toBe(1);
      expect(useQuizStore.getState().status).toBe("STARTED");

      useQuizStore.getState().tickTimer();
      expect(useQuizStore.getState().timeRemainingSeconds).toBe(0);
      expect(useQuizStore.getState().status).toBe("EXPIRED");
    });

    test("should log proctored anti-cheat warnings and update switch counts", () => {
      useQuizStore.getState().startAttempt({
        attemptId: "att_test_100",
        quizId: "quiz_test_1",
        questions: mockQuestions,
        timeLimitSeconds: 180,
      });

      useQuizStore.getState().addWarning("TAB_SWITCH", "User switched tab.");
      
      const state = useQuizStore.getState();
      expect(state.warnings.length).toBe(1);
      expect(state.tabSwitchesCount).toBe(1);
      expect(state.warnings[0]?.type).toBe("TAB_SWITCH");
    });
  });
});
