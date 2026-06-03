import { useLeaderboardStore } from "../features/leaderboard/store/leaderboard-store";
import { getGlobalLeaderboard, getLeaderboardSeasons, getCompetitionWinners, getHallOfFame } from "../features/leaderboard/api";

describe("Mindrift F8 Leaderboards & Rankings Core Unit Test Suite", () => {
  beforeEach(() => {
    useLeaderboardStore.getState().clearStore();
  });

  describe("Zustand Leaderboard Store Management", () => {
    const mockUsers = [
      {
        id: "user-1",
        name: "Sarah Connor",
        username: "terminator_slayer",
        globalRank: 1,
        score: 9850,
        accuracy: 94,
        competitionPoints: 4200,
        achievementScore: 1200,
        streak: 45,
        tier: "ELITE" as const,
        categoryPoints: { Frontend: 3500, Backend: 4000, AI: 2350, DevOps: 0 },
        categoryRanks: { Frontend: 2, Backend: 1, AI: 3 },
        rankHistory: []
      },
      {
        id: "user_demo",
        name: "Arthur Dent",
        username: "arthur_dent",
        globalRank: 2,
        score: 9240,
        accuracy: 92,
        competitionPoints: 3800,
        achievementScore: 1100,
        streak: 42,
        tier: "ELITE" as const,
        categoryPoints: { Frontend: 3800, Backend: 3200, AI: 1200, DevOps: 1040 },
        categoryRanks: { Frontend: 1, Backend: 4, AI: 12, DevOps: 2 },
        rankHistory: []
      }
    ];

    test("should successfully configure active filters and category keys", () => {
      const store = useLeaderboardStore.getState();
      expect(store.activeFilter).toBe("global");
      expect(store.activeCategory).toBe("ALL");

      useLeaderboardStore.getState().setActiveFilter("category");
      useLeaderboardStore.getState().setActiveCategory("Frontend");

      const updated = useLeaderboardStore.getState();
      expect(updated.activeFilter).toBe("category");
      expect(updated.activeCategory).toBe("Frontend");
    });

    test("should load sorted global standings rosters into state", () => {
      useLeaderboardStore.getState().setGlobalLeaderboard(mockUsers);
      
      const state = useLeaderboardStore.getState();
      expect(state.globalLeaderboard.length).toBe(2);
      expect(state.globalLeaderboard[0].id).toBe("user-1"); // highest score first
    });

    test("should update user score and dynamically resort standing ranks", () => {
      useLeaderboardStore.getState().setGlobalLeaderboard(mockUsers);
      
      // Arthur Dent starts at 9240, Sarah Connor is 9850.
      // Arthur scores +800 XP, total becomes 10040. Ranks shift!
      useLeaderboardStore.getState().updateUserScore("user_demo", 800, 95);

      const state = useLeaderboardStore.getState();
      expect(state.globalLeaderboard[0].id).toBe("user_demo"); // Arthur Dent is now #1!
      expect(state.globalLeaderboard[0].globalRank).toBe(1);
      expect(state.globalLeaderboard[1].id).toBe("user-1"); // Sarah Connor is now #2!
      expect(state.globalLeaderboard[1].globalRank).toBe(2);
    });

    test("should successfully hold side-by-side comparison slots", () => {
      useLeaderboardStore.getState().setComparisonUser("A", mockUsers[0]);
      useLeaderboardStore.getState().setComparisonUser("B", mockUsers[1]);

      const state = useLeaderboardStore.getState();
      expect(state.comparisonUserA?.id).toBe("user-1");
      expect(state.comparisonUserB?.id).toBe("user_demo");
    });
  });

  describe("API Endpoint Fallback Testing", () => {
    test("getGlobalLeaderboard returns roster payload", async () => {
      const data = await getGlobalLeaderboard();
      expect(data.length).toBeGreaterThan(0);
      expect(data[0].score).toBeGreaterThan(data[1].score);
    });

    test("getLeaderboardSeasons returns season data", async () => {
      const data = await getLeaderboardSeasons();
      expect(data.length).toBeGreaterThan(0);
      expect(data[0].status).toBe("ACTIVE");
    });

    test("getCompetitionWinners returns historic match listings", async () => {
      const data = await getCompetitionWinners();
      expect(data.length).toBeGreaterThan(0);
      expect(data[0].winnerName).toBeDefined();
    });

    test("getHallOfFame returns legacy champions cards", async () => {
      const data = await getHallOfFame();
      expect(data.length).toBeGreaterThan(0);
      expect(data[0].title).toBeDefined();
    });
  });
});
