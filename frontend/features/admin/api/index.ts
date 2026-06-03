import { apiClient } from "@/lib/api-client";
import { AdminUser, AdminCompetition, AdminQuiz, AntiCheatEvent, PlatformHealthMetric, AuditRecord, AIMonitorStat } from "../types";

// Roster of mock database entries (Task 19 fallbacks)
const mockUsers: AdminUser[] = [
  { id: "user-1", name: "Sarah Connor", username: "terminator_slayer", email: "sarah.connor@rebels.net", role: "ADMIN", status: "ACTIVE", violationsCount: 0, registeredAt: "2026-02-01" },
  { id: "user_demo", name: "Arthur Dent", username: "arthur_dent", email: "arthur.dent@university.edu", role: "ADMIN", status: "ACTIVE", violationsCount: 2, registeredAt: "2026-01-15" },
  { id: "user-2", name: "Gaurav Singh", username: "singh_star", email: "gaurav.singh@university.edu", role: "USER", status: "ACTIVE", violationsCount: 1, registeredAt: "2026-03-01" },
  { id: "user-3", name: "Alex Mercer", username: "prototype_x", email: "alex.mercer@gentek.org", role: "USER", status: "ACTIVE", violationsCount: 5, registeredAt: "2026-03-10" }
];

const mockCompetitions: AdminCompetition[] = [
  { id: "competition-1", title: "Docker Swarm Advanced Cluster quiz", category: "DevOps", scheduledAt: new Date(Date.now() + 3600000).toISOString(), maxParticipants: 100, participantsCount: 42, status: "ACTIVE" },
  { id: "competition-2", title: "Java Multi-Threading Hackathon", category: "Java", scheduledAt: new Date(Date.now() - 3600000 * 24).toISOString(), maxParticipants: 50, participantsCount: 25, status: "UPCOMING" }
];

const mockQuizzes: AdminQuiz[] = [
  { id: "quiz-1", title: "Next.js Core Hydration Architecture", category: "Frontend", status: "PUBLISHED", questionCount: 10 },
  { id: "quiz-2", title: "Apache Kafka retention brokers config", category: "DevOps", status: "PUBLISHED", questionCount: 5 },
  { id: "quiz-3", title: "Java threading semaphores practice", category: "Java", status: "DRAFT", questionCount: 8 }
];

const mockViolations: AntiCheatEvent[] = [
  { id: "v_1", username: "Alex Mercer", userId: "user-3", violationType: "TAB_SWITCH", details: "Switched browser focus tab during proctored Java hackathon.", timestamp: new Date(Date.now() - 1000 * 300).toISOString(), status: "UNREVIEWED" },
  { id: "v_2", username: "Arthur Dent", userId: "user_demo", violationType: "COPY_PASTE", details: "Interfered copy-paste shortcut keys during proctor exam.", timestamp: new Date(Date.now() - 1000 * 600).toISOString(), status: "FLAGGED" }
];

const mockHealth: PlatformHealthMetric[] = [
  { id: "h_1", name: "PostgreSQL Database Cluster", status: "HEALTHY", value: "Primary cluster responsive", latency: "14ms" },
  { id: "h_2", name: "Redis Sorted Sets Cache", status: "HEALTHY", value: "Cache hit-ratio: 97.4%", latency: "2ms" },
  { id: "h_3", name: "Apache Kafka Message Broker", status: "HEALTHY", value: "Consumer lag: 0", latency: "11ms" },
  { id: "h_4", name: "Gemini API Gateway", status: "HEALTHY", value: "Primary core ONLINE", latency: "120ms" }
];

const mockAudit: AuditRecord[] = [
  { id: "au_1", adminName: "Sarah Connor", action: "SUSPEND_USER", target: "Alex Mercer (user-3)", ip: "192.168.1.1", timestamp: new Date(Date.now() - 3600000).toISOString(), type: "USER" },
  { id: "au_2", adminName: "Sarah Connor", action: "FORCE_START_COMP", target: "Docker Swarm Speedrun (comp-1)", ip: "192.168.1.1", timestamp: new Date(Date.now() - 1800000).toISOString(), type: "COMPETITION" }
];

const mockAIStats: AIMonitorStat[] = [
  { provider: "Gemini", requests: 12040, tokens: 4200400, errorRate: 0.04, latencyMs: 140, status: "ONLINE" },
  { provider: "OpenAI", requests: 3450, tokens: 1240200, errorRate: 0.12, latencyMs: 280, status: "ONLINE" }
];

export async function getAdminUsers(): Promise<AdminUser[]> {
  try {
    return await apiClient<AdminUser[]>("/admin/users");
  } catch (err) {
    console.warn("⚠️ API offline: Returning mock admin users.", err);
    return mockUsers;
  }
}

export async function modifyAdminUser(id: string, updates: Partial<AdminUser>): Promise<{ success: boolean }> {
  try {
    await apiClient(`/admin/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates)
    });
    return { success: true };
  } catch (err) {
    console.warn(`⚠️ API offline: Emulated successful user update for ${id}.`, err);
    return { success: true };
  }
}

export async function getAdminCompetitions(): Promise<AdminCompetition[]> {
  try {
    return await apiClient<AdminCompetition[]>("/admin/competitions");
  } catch (err) {
    console.warn("⚠️ API offline: Returning mock admin competitions.", err);
    return mockCompetitions;
  }
}

export async function modifyAdminCompetitionStatus(id: string, status: AdminCompetition["status"]): Promise<{ success: boolean }> {
  try {
    await apiClient(`/admin/competitions/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status })
    });
    return { success: true };
  } catch (err) {
    console.warn(`⚠️ API offline: Emulated competition status change to ${status} for ${id}.`, err);
    return { success: true };
  }
}

export async function getAdminQuizzes(): Promise<AdminQuiz[]> {
  try {
    return await apiClient<AdminQuiz[]>("/admin/quizzes");
  } catch (err) {
    console.warn("⚠️ API offline: Returning mock admin quizzes.", err);
    return mockQuizzes;
  }
}

export async function modifyAdminQuizStatus(id: string, status: AdminQuiz["status"]): Promise<{ success: boolean }> {
  try {
    await apiClient(`/admin/quizzes/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status })
    });
    return { success: true };
  } catch (err) {
    console.warn(`⚠️ API offline: Emulated quiz status change to ${status} for ${id}.`, err);
    return { success: true };
  }
}

export async function getLiveAntiCheatViolations(): Promise<AntiCheatEvent[]> {
  try {
    return await apiClient<AntiCheatEvent[]>("/admin/anti-cheat");
  } catch (err) {
    console.warn("⚠️ API offline: Returning mock anti-cheat violations.", err);
    return mockViolations;
  }
}

export async function reviewAntiCheatViolation(id: string, status: AntiCheatEvent["status"]): Promise<{ success: boolean }> {
  try {
    await apiClient(`/admin/anti-cheat/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status })
    });
    return { success: true };
  } catch (err) {
    console.warn(`⚠️ API offline: Emulated violation review status ${status} for ${id}.`, err);
    return { success: true };
  }
}

export async function getPlatformHealth(): Promise<{ health: PlatformHealthMetric[]; aiStats: AIMonitorStat[] }> {
  try {
    const health = await apiClient<PlatformHealthMetric[]>("/admin/health");
    const aiStats = await apiClient<AIMonitorStat[]>("/admin/ai");
    return { health, aiStats };
  } catch (err) {
    console.warn("⚠️ API offline: Returning mock platform health stats.", err);
    return { health: mockHealth, aiStats: mockAIStats };
  }
}

export async function getAuditLogs(): Promise<AuditRecord[]> {
  try {
    return await apiClient<AuditRecord[]>("/admin/audit-logs");
  } catch (err) {
    console.warn("⚠️ API offline: Returning mock audit logs.", err);
    return mockAudit;
  }
}

export async function broadcastSystemNotification(title: string, message: string, type: string): Promise<{ success: boolean }> {
  try {
    return await apiClient<{ success: boolean }>("/admin/notifications", {
      method: "POST",
      body: JSON.stringify({ title, message, type })
    });
  } catch (err) {
    console.warn("⚠️ API offline: Emulated notification broadcast.", err);
    return { success: true };
  }
}
