import { useAdminStore } from "../features/admin/store/admin-store";
import {
  getAdminUsers,
  modifyAdminUser,
  getAdminCompetitions,
  modifyAdminCompetitionStatus,
  getAdminQuizzes,
  modifyAdminQuizStatus,
  getLiveAntiCheatViolations,
  reviewAntiCheatViolation,
  getPlatformHealth,
  getAuditLogs,
  broadcastSystemNotification
} from "../features/admin/api";
import { normalizeRole, hasRole, hasPermission } from "../lib/auth-utils";

describe("Mindrift F12 Admin Panel & Platform Control Center Unit Test Suite", () => {
  beforeEach(() => {
    useAdminStore.getState().clearStore();
  });

  describe("Task 3: RBAC Frontend Guards Logic", () => {
    test("should normalize role names by stripping ROLE_ prefix and converting to uppercase", () => {
      expect(normalizeRole("ROLE_ADMIN")).toBe("ADMIN");
      expect(normalizeRole("ROLE_MODERATOR")).toBe("MODERATOR");
      expect(normalizeRole("user")).toBe("USER");
      expect(normalizeRole("SUPER_ADMIN")).toBe("SUPER_ADMIN");
    });

    test("should check user roles using hasRole helper correctly", () => {
      const userRoles = ["ROLE_USER", "ROLE_MODERATOR"];
      expect(hasRole(userRoles, "USER")).toBe(true);
      expect(hasRole(userRoles, "MODERATOR")).toBe(true);
      expect(hasRole(userRoles, "ADMIN")).toBe(false);
    });

    test("should grant absolute access to SUPER_ADMIN", () => {
      const superAdminRoles = ["ROLE_SUPER_ADMIN"];
      expect(hasRole(superAdminRoles, "ADMIN")).toBe(true);
      expect(hasRole(superAdminRoles, "USER")).toBe(true);
      expect(hasRole(superAdminRoles, "MODERATOR")).toBe(true);
    });

    test("should handle missing or empty roles gracefully in hasRole", () => {
      expect(hasRole(undefined, "ADMIN")).toBe(false);
      expect(hasRole([], "ADMIN")).toBe(false);
    });

    test("should verify user permissions using hasPermission helper", () => {
      const permissions = ["quizzes:read", "quizzes:create", "competitions:control"];
      
      // Match all permissions
      expect(hasPermission(permissions, "quizzes:read")).toBe(true);
      expect(hasPermission(permissions, ["quizzes:read", "quizzes:create"])).toBe(true);
      expect(hasPermission(permissions, ["quizzes:read", "admin:all"])).toBe(false);
      
      // Match any permissions
      expect(hasPermission(permissions, ["quizzes:read", "admin:all"], false)).toBe(true);
      expect(hasPermission(permissions, ["admin:all", "monitoring:read"], false)).toBe(false);
    });

    test("should handle missing or empty permissions in hasPermission", () => {
      expect(hasPermission(undefined, "quizzes:read")).toBe(false);
      expect(hasPermission([], "quizzes:read")).toBe(false);
    });
  });

  describe("Task 18: Zustand Admin Control Store Tests", () => {
    test("should populate and mutate users list and attributes", () => {
      const mockUsers = [
        { id: "usr-1", name: "Arthur Dent", username: "arthur_dent", email: "arthur@guide.org", role: "USER", status: "ACTIVE", violationsCount: 0, registeredAt: "2026-05-01" },
        { id: "usr-2", name: "Ford Prefect", username: "ford_prefect", email: "ford@guide.org", role: "MODERATOR", status: "ACTIVE", violationsCount: 2, registeredAt: "2026-05-02" }
      ];

      useAdminStore.getState().setUsers(mockUsers);
      expect(useAdminStore.getState().users.length).toBe(2);

      // Update Role
      useAdminStore.getState().updateUserRole("usr-1", "ADMIN");
      expect(useAdminStore.getState().users[0].role).toBe("ADMIN");

      // Update Status
      useAdminStore.getState().updateUserStatus("usr-2", "SUSPENDED");
      expect(useAdminStore.getState().users[1].status).toBe("SUSPENDED");
    });

    test("should populate and mutate competitions overrides", () => {
      const mockCompetitions = [
        { id: "comp-1", title: "Docker Swarm Advanced", category: "DevOps", scheduledAt: "2026-06-03T10:00:00Z", maxParticipants: 50, participantsCount: 12, status: "UPCOMING" }
      ];

      useAdminStore.getState().setCompetitions(mockCompetitions);
      expect(useAdminStore.getState().competitions.length).toBe(1);

      // Force start (UPCOMING -> ACTIVE)
      useAdminStore.getState().updateCompetitionStatus("comp-1", "ACTIVE");
      expect(useAdminStore.getState().competitions[0].status).toBe("ACTIVE");
    });

    test("should populate and mutate quizzes statuses", () => {
      const mockQuizzes = [
        { id: "quiz-1", title: "Next.js Core Architecture", category: "Frontend", status: "DRAFT", questionCount: 10 }
      ];

      useAdminStore.getState().setQuizzes(mockQuizzes);
      expect(useAdminStore.getState().quizzes.length).toBe(1);

      // Publish quiz (DRAFT -> PUBLISHED)
      useAdminStore.getState().updateQuizStatus("quiz-1", "PUBLISHED");
      expect(useAdminStore.getState().quizzes[0].status).toBe("PUBLISHED");
    });

    test("should populate and mutate anti-cheat integrity warnings", () => {
      const mockViolations = [
        { id: "v-1", username: "Arthur Dent", userId: "usr-1", violationType: "TAB_SWITCH", details: "User tab blur.", timestamp: "2026-06-02T12:00:00Z", status: "UNREVIEWED" }
      ];

      useAdminStore.getState().setViolations(mockViolations);
      expect(useAdminStore.getState().violations.length).toBe(1);

      // Disqualify user
      useAdminStore.getState().updateViolationStatus("v-1", "DISQUALIFIED");
      expect(useAdminStore.getState().violations[0].status).toBe("DISQUALIFIED");
    });

    test("should support health, ai and audit log vector injections", () => {
      const health = [
        { id: "h-1", name: "PostgreSQL Database", status: "HEALTHY", value: "Active", latency: "12ms" }
      ];
      const audits = [
        { id: "au-1", adminName: "Sarah Connor", action: "SUSPEND_USER", target: "Alex Mercer", ip: "127.0.0.1", timestamp: "2026-06-02T13:00:00Z", type: "USER" }
      ];
      const aiStats = [
        { provider: "Gemini", requests: 120, tokens: 45000, errorRate: 0.02, latencyMs: 110, status: "ONLINE" }
      ];

      useAdminStore.getState().setHealthMetrics(health);
      useAdminStore.getState().setAuditLogs(audits);
      useAdminStore.getState().setAIStats(aiStats);

      const state = useAdminStore.getState();
      expect(state.healthMetrics.length).toBe(1);
      expect(state.auditLogs.length).toBe(1);
      expect(state.aiStats.length).toBe(1);
    });

    test("should clear the store cleanly", () => {
      useAdminStore.getState().setUsers([
        { id: "usr-1", name: "Arthur", username: "arthur", email: "a@a.com", role: "USER", status: "ACTIVE", violationsCount: 0, registeredAt: "" }
      ]);
      expect(useAdminStore.getState().users.length).toBe(1);

      useAdminStore.getState().clearStore();
      expect(useAdminStore.getState().users.length).toBe(0);
    });
  });

  describe("Task 19: Admin API integrations with robust fallbacks", () => {
    test("getAdminUsers should fetch all user details registries", async () => {
      const users = await getAdminUsers();
      expect(users.length).toBeGreaterThan(0);
      expect(users[0].username).toBeDefined();
    });

    test("modifyAdminUser should return success confirmation on mutations", async () => {
      const result = await modifyAdminUser("user-1", { status: "SUSPENDED" });
      expect(result.success).toBe(true);
    });

    test("getAdminCompetitions should fetch target competition list", async () => {
      const comps = await getAdminCompetitions();
      expect(comps.length).toBeGreaterThan(0);
      expect(comps[0].title).toBeDefined();
    });

    test("modifyAdminCompetitionStatus should return success confirmation", async () => {
      const result = await modifyAdminCompetitionStatus("competition-1", "CANCELLED");
      expect(result.success).toBe(true);
    });

    test("getAdminQuizzes should retrieve the quiz collections", async () => {
      const quizzes = await getAdminQuizzes();
      expect(quizzes.length).toBeGreaterThan(0);
      expect(quizzes[0].title).toBeDefined();
    });

    test("modifyAdminQuizStatus should return success", async () => {
      const result = await modifyAdminQuizStatus("quiz-1", "PUBLISHED");
      expect(result.success).toBe(true);
    });

    test("getLiveAntiCheatViolations should return security violations list", async () => {
      const violations = await getLiveAntiCheatViolations();
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].violationType).toBeDefined();
    });

    test("reviewAntiCheatViolation should update incident status with success", async () => {
      const result = await reviewAntiCheatViolation("v_1", "CLEARED");
      expect(result.success).toBe(true);
    });

    test("getPlatformHealth should return multi-system health and AI monitoring telemetry", async () => {
      const data = await getPlatformHealth();
      expect(data.health.length).toBeGreaterThan(0);
      expect(data.aiStats.length).toBeGreaterThan(0);
      expect(data.health[0].name).toBeDefined();
      expect(data.aiStats[0].provider).toBeDefined();
    });

    test("getAuditLogs should return admin activity trails", async () => {
      const audits = await getAuditLogs();
      expect(audits.length).toBeGreaterThan(0);
      expect(audits[0].action).toBeDefined();
    });

    test("broadcastSystemNotification should dispatch socket broadcaster payload", async () => {
      const result = await broadcastSystemNotification("Global Swarm Arena Alert", "Swarm tournament will commence in 10 minutes.", "SYSTEM");
      expect(result.success).toBe(true);
    });
  });
});
