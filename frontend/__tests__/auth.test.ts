import { normalizeRole, hasRole, hasPermission } from "../lib/auth-utils";
import { useUserStore } from "../stores/user-store";

describe("Mindrift Authentication & RBAC Test Suite", () => {
  // Reset the Zustand store before each test
  beforeEach(() => {
    useUserStore.getState().clear();
  });

  describe("Task 11: RBAC Normalization Utilities", () => {
    test("should normalize role strings correctly", () => {
      expect(normalizeRole("ROLE_ADMIN")).toBe("ADMIN");
      expect(normalizeRole("role_admin")).toBe("ROLE_ADMIN"); // Case-sensitive removal of ROLE_ prefix
      expect(normalizeRole("ADMIN")).toBe("ADMIN");
      expect(normalizeRole("ROLE_SUPER_ADMIN")).toBe("SUPER_ADMIN");
    });

    test("should validate hasRole correctly with single and multiple roles", () => {
      const userRoles = ["ROLE_USER", "ROLE_CREATOR"];
      
      expect(hasRole(userRoles, "USER")).toBe(true);
      expect(hasRole(userRoles, "CREATOR")).toBe(true);
      expect(hasRole(userRoles, "ADMIN")).toBe(false);
      expect(hasRole(userRoles, ["ADMIN", "USER"])).toBe(true);
      expect(hasRole(userRoles, ["ADMIN", "MODERATOR"])).toBe(false);
    });

    test("should grant access to SUPER_ADMIN for any required role checks", () => {
      const superAdminRoles = ["ROLE_SUPER_ADMIN"];
      expect(hasRole(superAdminRoles, "ADMIN")).toBe(true);
      expect(hasRole(superAdminRoles, "USER")).toBe(true);
    });

    test("should validate permissions matching", () => {
      const permissions = ["quizzes:read", "quizzes:create", "quizzes:delete"];

      expect(hasPermission(permissions, "quizzes:read")).toBe(true);
      expect(hasPermission(permissions, ["quizzes:read", "quizzes:create"])).toBe(true);
      expect(hasPermission(permissions, ["quizzes:read", "competitions:join"])).toBe(false);
      expect(hasPermission(permissions, ["quizzes:read", "competitions:join"], false)).toBe(true); // matchAll = false
    });
  });

  describe("Task 9: Zustand Session Store", () => {
    test("should initialize with default authenticated = false states", () => {
      const state = useUserStore.getState();
      expect(state.profile).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    test("should successfully write profile and trigger authenticated flag", () => {
      const mockProfile = {
        id: "usr_100",
        clerkId: "user_clerk_100",
        username: "test_coder",
        email: "coder@mindrift.app",
        roles: ["ROLE_USER" as const],
        permissions: ["quizzes:read"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      useUserStore.getState().setProfile(mockProfile);

      const state = useUserStore.getState();
      expect(state.profile).toEqual(mockProfile);
      expect(state.isAuthenticated).toBe(true);
    });

    test("should clear session and authenticate flag on logout action", () => {
      const mockProfile = {
        id: "usr_100",
        clerkId: "user_clerk_100",
        username: "test_coder",
        email: "coder@mindrift.app",
        roles: ["ROLE_USER" as const],
        permissions: ["quizzes:read"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      useUserStore.getState().setProfile(mockProfile);
      useUserStore.getState().clear();

      const state = useUserStore.getState();
      expect(state.profile).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });
});
