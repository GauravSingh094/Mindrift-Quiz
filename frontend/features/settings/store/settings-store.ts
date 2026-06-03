import { create } from "zustand";
import { UserProfile, UserPreferences, NotificationSettings, UserSession, PrivacySettings, ConnectedAccount, AIPerferences } from "../types";

interface SettingsStoreState {
  profile: UserProfile | null;
  preferences: UserPreferences | null;
  notifications: NotificationSettings | null;
  sessions: UserSession[];
  privacy: PrivacySettings | null;
  connections: ConnectedAccount[];
  aiPreferences: AIPerferences | null;

  setProfile: (profile: UserProfile) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  setPreferences: (preferences: UserPreferences) => void;
  setNotifications: (notifications: NotificationSettings) => void;
  updateNotifications: (notifications: Partial<NotificationSettings>) => void;
  setSessions: (sessions: UserSession[]) => void;
  revokeSession: (id: string) => void;
  revokeAllSessions: () => void;
  setPrivacy: (privacy: PrivacySettings) => void;
  updatePrivacy: (privacy: Partial<PrivacySettings>) => void;
  setConnections: (connections: ConnectedAccount[]) => void;
  toggleConnection: (provider: "google" | "github" | "linkedin", connect: boolean) => void;
  setAIPreferences: (ai: AIPerferences) => void;
  updateAIPreferences: (ai: Partial<AIPerferences>) => void;
  clearStore: () => void;
}

export const useSettingsStore = create<SettingsStoreState>((set) => ({
  profile: null,
  preferences: null,
  notifications: null,
  sessions: [],
  privacy: null,
  connections: [],
  aiPreferences: null,

  setProfile: (profile) => set({ profile }),
  updateProfile: (updates) =>
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...updates } : null
    })),

  setPreferences: (preferences) => set({ preferences }),
  
  setNotifications: (notifications) => set({ notifications }),
  updateNotifications: (updates) =>
    set((state) => ({
      notifications: state.notifications ? { ...state.notifications, ...updates } : null
    })),

  setSessions: (sessions) => set({ sessions }),
  revokeSession: (id) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id)
    })),
  revokeAllSessions: () =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.isCurrent)
    })),

  setPrivacy: (privacy) => set({ privacy }),
  updatePrivacy: (updates) =>
    set((state) => ({
      privacy: state.privacy ? { ...state.privacy, ...updates } : null
    })),

  setConnections: (connections) => set({ connections }),
  toggleConnection: (provider, connect) =>
    set((state) => ({
      connections: state.connections.map((c) =>
        c.provider === provider ? { ...c, connected: connect, email: connect ? "arthur.dent@university.edu" : undefined } : c
      )
    })),

  setAIPreferences: (aiPreferences) => set({ aiPreferences }),
  updateAIPreferences: (updates) =>
    set((state) => ({
      aiPreferences: state.aiPreferences ? { ...state.aiPreferences, ...updates } : null
    })),

  clearStore: () =>
    set({
      profile: null,
      preferences: null,
      notifications: null,
      sessions: [],
      privacy: null,
      connections: [],
      aiPreferences: null
    })
}));

export default useSettingsStore;
