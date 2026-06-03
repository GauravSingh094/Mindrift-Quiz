export interface AdminUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: "USER" | "MODERATOR" | "ADMIN" | "SUPER_ADMIN";
  status: "ACTIVE" | "SUSPENDED";
  violationsCount: number;
  registeredAt: string;
}

export interface AdminCompetition {
  id: string;
  title: string;
  category: string;
  scheduledAt: string;
  maxParticipants: number;
  participantsCount: number;
  status: "UPCOMING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
}

export interface AdminQuiz {
  id: string;
  title: string;
  category: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  questionCount: number;
}

export interface AntiCheatEvent {
  id: string;
  username: string;
  userId: string;
  violationType: "TAB_SWITCH" | "COPY_PASTE" | "FULLSCREEN_EXIT";
  details: string;
  timestamp: string;
  status: "UNREVIEWED" | "FLAGGED" | "DISQUALIFIED" | "CLEARED";
}

export interface PlatformHealthMetric {
  id: string;
  name: string;
  status: "HEALTHY" | "DEGRADED" | "CRITICAL";
  value: string;
  latency: string;
}

export interface AuditRecord {
  id: string;
  adminName: string;
  action: string;
  target: string;
  ip: string;
  timestamp: string;
  type: "SECURITY" | "USER" | "COMPETITION" | "SYSTEM";
}

export interface AIMonitorStat {
  provider: "Gemini" | "OpenAI";
  requests: number;
  tokens: number;
  errorRate: number;
  latencyMs: number;
  status: "ONLINE" | "OFFLINE";
}
