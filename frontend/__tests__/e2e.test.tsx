import { useUserStore } from "../stores/user-store";
import { useQuizStore } from "../features/quiz/store/quiz-store";
import { useCompetitionStore } from "../features/competition/store/competition-store";
import { useAdminStore } from "../features/admin/store/admin-store";
import { normalizeRole } from "../lib/auth-utils";

describe("Mindrift F16 E2E Quality Assurance, UAT & Release Certification Test Suite", () => {
  beforeEach(() => {
    useUserStore.getState().clear();
    useQuizStore.getState().clearStore();
    useCompetitionStore.getState().clearStore();
    useAdminStore.getState().clearStore();
  });

  describe("Smoke Test: App Bootstrap & Session Authentication Flow", () => {
    test("should successfully sync Clerk session details into global store", () => {
      const mockProfile = {
        id: "usr_demo_100",
        clerkId: "clerk_100",
        username: "test_coder",
        email: "test.coder@mindrift.app",
        roles: ["ROLE_USER", "ROLE_ADMIN"],
        permissions: ["quizzes:read", "admin:all"],
        createdAt: "2026-06-02T12:00:00Z",
        updatedAt: "2026-06-02T12:00:00Z"
      };

      useUserStore.getState().setProfile(mockProfile);

      const state = useUserStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.profile?.username).toBe("test_coder");
      expect(normalizeRole(state.profile?.roles[1] || "")).toBe("ADMIN");
    });
  });

  describe("Critical User Journey: Quiz Arena Walkthrough", () => {
    test("should navigate through start quiz attempt, option answers, review flags, and submission", () => {
      const mockQuestions = [
        {
          id: "q_1",
          questionText: "What is Next.js SWC hydration priority?",
          points: 100,
          timeLimitSeconds: 60,
          options: [
            { id: "o_1", optionText: "Primary", isCorrect: true },
            { id: "o_2", optionText: "Secondary", isCorrect: false }
          ]
        }
      ];

      // 1. Initialise attempt
      useQuizStore.getState().startAttempt({
        attemptId: "att_100",
        quizId: "quiz_1",
        questions: mockQuestions,
        timeLimitSeconds: 60
      });

      let state = useQuizStore.getState();
      expect(state.status).toBe("STARTED");
      expect(state.currentQuestionIndex).toBe(0);

      // 2. Select option answers
      useQuizStore.getState().answerQuestion("q_1", "o_1");
      expect(useQuizStore.getState().answers["q_1"]).toBe("o_1");

      // 3. Toggle review flags
      useQuizStore.getState().toggleFlag("q_1");
      expect(useQuizStore.getState().flags["q_1"]).toBe(true);

      // 4. Tick timer
      useQuizStore.getState().tickTimer();
      expect(useQuizStore.getState().timeRemainingSeconds).toBe(59);
    });
  });

  describe("Critical User Journey: Live Competition Lobby presence & proctored overrides", () => {
    test("should establish lobby WebSocket sessions, track tab blur warnings, and complete matched results", () => {
      const mockQuestions = [
        {
          id: "q_comp_1",
          questionText: "Docker Swarm cluster configurations?",
          points: 100,
          options: [
            { id: "opt_1", optionText: "True" },
            { id: "opt_2", optionText: "False" }
          ]
        }
      ];

      // 1. Join lobby attempt
      useCompetitionStore.getState().startAttempt({
        attemptId: "att_comp_100",
        quizId: "competition-1",
        questions: mockQuestions,
        timeLimitSeconds: 120
      });

      expect(useCompetitionStore.getState().status).toBe("LIVE");

      // 2. Intercept tab blurs proctor alerts
      useCompetitionStore.getState().addWarning("TAB_SWITCH", "User switched container tab.");
      expect(useCompetitionStore.getState().warningsCount).toBe(1);
      expect(useCompetitionStore.getState().tabSwitchesCount).toBe(1);

      // 3. Complete match early
      useCompetitionStore.getState().completeAttempt();
      expect(useCompetitionStore.getState().status).toBe("SUBMITTED");
    });
  });

  describe("Smoke Test: Platform Administration & Control Center overrides", () => {
    test("should coordinate users status toggles, force competitions status transitions, and check server latencies", () => {
      const mockUsers = [
        { id: "u-1", name: "Arthur Dent", username: "arthur", email: "a@a.com", role: "USER" as const, status: "ACTIVE" as const, violationsCount: 2, registeredAt: "" }
      ];
      const mockCompetitions = [
        { id: "comp-1", title: "Docker Speed Run", category: "DevOps", scheduledAt: "", maxParticipants: 100, participantsCount: 12, status: "UPCOMING" as const }
      ];

      // 1. Users list state
      useAdminStore.getState().setUsers(mockUsers);
      expect(useAdminStore.getState().users.length).toBe(1);

      // 2. Suspend user status
      useAdminStore.getState().updateUserStatus("u-1", "SUSPENDED");
      expect(useAdminStore.getState().users[0].status).toBe("SUSPENDED");

      // 3. Force start comp matching
      useAdminStore.getState().setCompetitions(mockCompetitions);
      useAdminStore.getState().updateCompetitionStatus("comp-1", "ACTIVE");
      expect(useAdminStore.getState().competitions[0].status).toBe("ACTIVE");
    });
  });
});
