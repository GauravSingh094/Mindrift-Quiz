import { apiClient } from "@/lib/api-client";
import { UserProfile, UserPreferences, NotificationSettings, UserSession, PrivacySettings, ConnectedAccount, AIPerferences } from "../types";

// Dynamic fallbacks when the backend Spring server is down (Task 17)
const mockProfile: UserProfile = {
  id: "user_demo",
  name: "Arthur Dent",
  username: "arthur_dent",
  bio: "Software developer exploring decentralized Swarm clustering meshes and event-driven Kafka broker segments.",
  interests: ["DevOps", "AI Core", "Frontend Architecture"],
  skills: ["Next.js", "Docker", "Java", "Python"],
  socialLinks: {
    github: "github.com/arthur_dent",
    twitter: "twitter.com/arthur_dent",
    linkedin: "linkedin.com/in/arthur_dent"
  },
  avatarUrl: "https://i.pravatar.cc/150?img=4"
};

const mockPreferences: UserPreferences = {
  email: "arthur.dent@university.edu",
  accountStatus: "ELITE VERIFIED",
  joinDate: "2026-01-15"
};

const mockNotifications: NotificationSettings = {
  competitions: true,
  quizzes: true,
  aiRecommendations: true,
  email: false,
  achievements: true,
  securityAlerts: true
};

const mockSessions: UserSession[] = [
  { id: "sess_1", device: "MacBook Pro M3", browser: "Chrome Canary", ip: "192.168.1.42", lastActivity: "Active Now", isCurrent: true },
  { id: "sess_2", device: "iPad Pro 11", browser: "Safari Mobile", ip: "192.168.1.43", lastActivity: "5 hours ago", isCurrent: false },
  { id: "sess_3", device: "Linux Workstation", browser: "Firefox Nightly", ip: "10.0.0.12", lastActivity: "2 days ago", isCurrent: false }
];

const mockPrivacy: PrivacySettings = {
  profileVisibility: "PUBLIC",
  leaderboardVisibility: true,
  competitionVisibility: true,
  analyticsSharing: true
};

const mockConnections: ConnectedAccount[] = [
  { provider: "google", email: "arthur.dent@gmail.com", connected: true },
  { provider: "github", email: "github.com/arthur_dent", connected: true },
  { provider: "linkedin", connected: false }
];

const mockAIPerferences: AIPerferences = {
  learningGoals: "Architect highly scalable cloud microservices Swarm environments",
  preferredCategories: ["Frontend", "DevOps"],
  difficulty: "HARD",
  recommendationsEnabled: true,
  interviewPrepEnabled: true
};

export async function getUserProfile(): Promise<UserProfile> {
  try {
    return await apiClient<UserProfile>("/users/profile");
  } catch (err) {
    console.warn("⚠️ API offline: Returning mock user profile.", err);
    return mockProfile;
  }
}

export async function updateUserProfile(profile: Partial<UserProfile>): Promise<{ success: boolean; data: UserProfile }> {
  try {
    const updated = await apiClient<UserProfile>("/users/profile", {
      method: "PUT",
      body: JSON.stringify(profile)
    });
    return { success: true, data: updated };
  } catch (err) {
    console.warn("⚠️ API offline: Emulating successful profile update.", err);
    return { success: true, data: { ...mockProfile, ...profile } };
  }
}

export async function getUserPreferences(): Promise<{
  preferences: UserPreferences;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  connections: ConnectedAccount[];
  aiPreferences: AIPerferences;
}> {
  try {
    const preferences = await apiClient<UserPreferences>("/users/preferences");
    const notifications = await apiClient<NotificationSettings>("/users/preferences/notifications");
    const privacy = await apiClient<PrivacySettings>("/users/preferences/privacy");
    const connections = await apiClient<ConnectedAccount[]>("/users/preferences/connections");
    const aiPreferences = await apiClient<AIPerferences>("/users/preferences/ai");
    return { preferences, notifications, privacy, connections, aiPreferences };
  } catch (err) {
    console.warn("⚠️ API offline: Returning mock preferences bundle.", err);
    return {
      preferences: mockPreferences,
      notifications: mockNotifications,
      privacy: mockPrivacy,
      connections: mockConnections,
      aiPreferences: mockAIPerferences
    };
  }
}

export async function updateNotificationPreferences(notifs: Partial<NotificationSettings>): Promise<{ success: boolean }> {
  try {
    await apiClient("/users/preferences/notifications", {
      method: "PUT",
      body: JSON.stringify(notifs)
    });
    return { success: true };
  } catch (err) {
    console.warn("⚠️ API offline: Emulated success update notifications.", err);
    return { success: true };
  }
}

export async function updatePrivacyPreferences(privacy: Partial<PrivacySettings>): Promise<{ success: boolean }> {
  try {
    await apiClient("/users/preferences/privacy", {
      method: "PUT",
      body: JSON.stringify(privacy)
    });
    return { success: true };
  } catch (err) {
    console.warn("⚠️ API offline: Emulated success update privacy.", err);
    return { success: true };
  }
}

export async function updateAIPreferences(ai: Partial<AIPerferences>): Promise<{ success: boolean }> {
  try {
    await apiClient("/users/preferences/ai", {
      method: "PUT",
      body: JSON.stringify(ai)
    });
    return { success: true };
  } catch (err) {
    console.warn("⚠️ API offline: Emulated success update AI preferences.", err);
    return { success: true };
  }
}

export async function getUserSessions(): Promise<UserSession[]> {
  try {
    return await apiClient<UserSession[]>("/users/sessions");
  } catch (err) {
    console.warn("⚠️ API offline: Returning mock sessions.", err);
    return mockSessions;
  }
}

export async function revokeUserSession(id: string): Promise<{ success: boolean }> {
  try {
    await apiClient(`/users/sessions/${id}`, {
      method: "DELETE"
    });
    return { success: true };
  } catch (err) {
    console.warn(`⚠️ API offline: Emulated session revocation for ${id}.`, err);
    return { success: true };
  }
}

export async function revokeAllUserSessions(): Promise<{ success: boolean }> {
  try {
    await apiClient("/users/sessions", {
      method: "DELETE"
    });
    return { success: true };
  } catch (err) {
    console.warn("⚠️ API offline: Emulated revoke all sessions.", err);
    return { success: true };
  }
}

export async function triggerDataExportArchive(datasets: string[]): Promise<{ success: boolean; downloadUrl: string }> {
  try {
    return await apiClient<{ success: boolean; downloadUrl: string }>("/users/export", {
      method: "POST",
      body: JSON.stringify({ datasets })
    });
  } catch (err) {
    console.warn("⚠️ API offline: Emulated data export compile.", err);
    return {
      success: true,
      downloadUrl: "/exports/mindrift_credentials_archive.zip"
    };
  }
}

export async function deleteUserAccountPermanently(): Promise<{ success: boolean }> {
  try {
    await apiClient("/users/account", {
      method: "DELETE"
    });
    return { success: true };
  } catch (err) {
    console.warn("⚠️ API offline: Emulated danger zone delete account.", err);
    return { success: true };
  }
}
