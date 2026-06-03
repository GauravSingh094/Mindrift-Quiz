import { useSettingsStore } from "../features/settings/store/settings-store";
import { getUserProfile, updateUserProfile, getUserPreferences, updateNotificationPreferences, updatePrivacyPreferences, updateAIPreferences, getUserSessions, revokeUserSession, revokeAllUserSessions, triggerDataExportArchive, deleteUserAccountPermanently } from "../features/settings/api";

describe("Mindrift F11 Settings & Profile Core Unit Test Suite", () => {
  beforeEach(() => {
    useSettingsStore.getState().clearStore();
  });

  describe("Zustand Settings Store Management", () => {
    test("should successfully configure profile details and skills mutations", () => {
      const mockProfile = {
        id: "user_demo",
        name: "Arthur Dent",
        username: "arthur_dent",
        bio: "Explorer of networks.",
        interests: [],
        skills: ["Docker"],
        socialLinks: {},
        avatarUrl: ""
      };

      useSettingsStore.getState().setProfile(mockProfile);

      const store = useSettingsStore.getState();
      expect(store.profile?.name).toBe("Arthur Dent");
      expect(store.profile?.skills.length).toBe(1);

      // Mutate profile details
      useSettingsStore.getState().updateProfile({ name: "Ford Prefect", skills: ["Docker", "Kafka"] });
      
      const updated = useSettingsStore.getState();
      expect(updated.profile?.name).toBe("Ford Prefect");
      expect(updated.profile?.skills.length).toBe(2);
    });

    test("should successfully update notifications and privacy toggles", () => {
      const mockNotifs = {
        competitions: true,
        quizzes: true,
        aiRecommendations: true,
        email: false,
        achievements: true,
        securityAlerts: true
      };

      const mockPrivacy = {
        profileVisibility: "PUBLIC" as const,
        leaderboardVisibility: true,
        competitionVisibility: true,
        analyticsSharing: true
      };

      useSettingsStore.getState().setNotifications(mockNotifs);
      useSettingsStore.getState().setPrivacy(mockPrivacy);

      const state = useSettingsStore.getState();
      expect(state.notifications?.email).toBe(false);
      expect(state.privacy?.profileVisibility).toBe("PUBLIC");

      // Mutate
      useSettingsStore.getState().updateNotifications({ email: true });
      useSettingsStore.getState().updatePrivacy({ profileVisibility: "PRIVATE" });

      const updated = useSettingsStore.getState();
      expect(updated.notifications?.email).toBe(true);
      expect(updated.privacy?.profileVisibility).toBe("PRIVATE");
    });

    test("should list active sessions and coordinate tokens revocation", () => {
      const mockSessions = [
        { id: "sess_1", device: "MacBook", browser: "Chrome", ip: "192.168.1.1", lastActivity: "Now", isCurrent: true },
        { id: "sess_2", device: "iPad", browser: "Safari", ip: "192.168.1.2", lastActivity: "1h ago", isCurrent: false }
      ];

      useSettingsStore.getState().setSessions(mockSessions);

      const state = useSettingsStore.getState();
      expect(state.sessions.length).toBe(2);

      // Revoke sess_2
      useSettingsStore.getState().revokeSession("sess_2");
      
      const updated = useSettingsStore.getState();
      expect(updated.sessions.length).toBe(1);
      expect(updated.sessions[0].id).toBe("sess_1");
    });

    test("should toggles connected Clerk SSO accounts provider link", () => {
      const mockConnections = [
        { provider: "google" as const, email: "arthur@gmail.com", connected: true },
        { provider: "github" as const, connected: false }
      ];

      useSettingsStore.getState().setConnections(mockConnections);

      const state = useSettingsStore.getState();
      expect(state.connections[1].connected).toBe(false);

      // Toggle connect github
      useSettingsStore.getState().toggleConnection("github", true);

      const updated = useSettingsStore.getState();
      expect(updated.connections[1].connected).toBe(true);
      expect(updated.connections[1].email).toBeDefined();
    });
  });

  describe("API Client Emulation Testing", () => {
    test("getUserProfile returns credentials payload", async () => {
      const data = await getUserProfile();
      expect(data.username).toBeDefined();
    });

    test("updateUserProfile returns updated data", async () => {
      const res = await updateUserProfile({ name: "Ford Prefect" });
      expect(res.success).toBe(true);
      expect(res.data.name).toBe("Ford Prefect");
    });

    test("getUserPreferences returns preferences bundle payload", async () => {
      const data = await getUserPreferences();
      expect(data.preferences.email).toBeDefined();
      expect(data.notifications.competitions).toBe(true);
    });

    test("updateNotificationPreferences, updatePrivacyPreferences, updateAIPreferences return success", async () => {
      const res1 = await updateNotificationPreferences({ email: true });
      const res2 = await updatePrivacyPreferences({ leaderboardVisibility: false });
      const res3 = await updateAIPreferences({ difficulty: "HARD" });
      expect(res1.success).toBe(true);
      expect(res2.success).toBe(true);
      expect(res3.success).toBe(true);
    });

    test("getUserSessions returns sessions array and revokeSession returns success", async () => {
      const sessions = await getUserSessions();
      expect(sessions.length).toBeGreaterThan(0);

      const res1 = await revokeUserSession("sess_2");
      const res2 = await revokeAllUserSessions();
      expect(res1.success).toBe(true);
      expect(res2.success).toBe(true);
    });

    test("triggerDataExportArchive returns secure zip url", async () => {
      const data = await triggerDataExportArchive(["profile"]);
      expect(data.success).toBe(true);
      expect(data.downloadUrl).toContain(".zip");
    });

    test("deleteUserAccountPermanently returns success", async () => {
      const res = await deleteUserAccountPermanently();
      expect(res.success).toBe(true);
    });
  });
});
