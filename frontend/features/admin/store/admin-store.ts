import { create } from "zustand";
import { AdminUser, AdminCompetition, AdminQuiz, AntiCheatEvent, PlatformHealthMetric, AuditRecord, AIMonitorStat } from "../types";

interface AdminStoreState {
  users: AdminUser[];
  competitions: AdminCompetition[];
  quizzes: AdminQuiz[];
  violations: AntiCheatEvent[];
  healthMetrics: PlatformHealthMetric[];
  auditLogs: AuditRecord[];
  aiStats: AIMonitorStat[];

  setUsers: (users: AdminUser[]) => void;
  updateUserRole: (userId: string, role: AdminUser["role"]) => void;
  updateUserStatus: (userId: string, status: AdminUser["status"]) => void;
  
  setCompetitions: (competitions: AdminCompetition[]) => void;
  updateCompetitionStatus: (compId: string, status: AdminCompetition["status"]) => void;
  
  setQuizzes: (quizzes: AdminQuiz[]) => void;
  updateQuizStatus: (quizId: string, status: AdminQuiz["status"]) => void;
  
  setViolations: (violations: AntiCheatEvent[]) => void;
  updateViolationStatus: (eventId: string, status: AntiCheatEvent["status"]) => void;
  
  setHealthMetrics: (healthMetrics: PlatformHealthMetric[]) => void;
  setAuditLogs: (auditLogs: AuditRecord[]) => void;
  setAIStats: (aiStats: AIMonitorStat[]) => void;
  
  clearStore: () => void;
}

export const useAdminStore = create<AdminStoreState>((set) => ({
  users: [],
  competitions: [],
  quizzes: [],
  violations: [],
  healthMetrics: [],
  auditLogs: [],
  aiStats: [],

  setUsers: (users) => set({ users }),
  updateUserRole: (userId, role) =>
    set((state) => ({
      users: state.users.map((u) => (u.id === userId ? { ...u, role } : u))
    })),
  updateUserStatus: (userId, status) =>
    set((state) => ({
      users: state.users.map((u) => (u.id === userId ? { ...u, status } : u))
    })),

  setCompetitions: (competitions) => set({ competitions }),
  updateCompetitionStatus: (compId, status) =>
    set((state) => ({
      competitions: state.competitions.map((c) => (c.id === compId ? { ...c, status } : c))
    })),

  setQuizzes: (quizzes) => set({ quizzes }),
  updateQuizStatus: (quizId, status) =>
    set((state) => ({
      quizzes: state.quizzes.map((q) => (q.id === quizId ? { ...q, status } : q))
    })),

  setViolations: (violations) => set({ violations }),
  updateViolationStatus: (eventId, status) =>
    set((state) => ({
      violations: state.violations.map((v) => (v.id === eventId ? { ...v, status } : v))
    })),

  setHealthMetrics: (healthMetrics) => set({ healthMetrics }),
  setAuditLogs: (auditLogs) => set({ auditLogs }),
  setAIStats: (aiStats) => set({ aiStats }),

  clearStore: () =>
    set({
      users: [],
      competitions: [],
      quizzes: [],
      violations: [],
      healthMetrics: [],
      auditLogs: [],
      aiStats: []
    })
}));

export default useAdminStore;
