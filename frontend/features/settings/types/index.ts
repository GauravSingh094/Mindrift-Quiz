export interface UserProfile {
  id: string;
  name: string;
  username: string;
  bio: string;
  interests: string[];
  skills: string[];
  socialLinks: {
    github?: string;
    twitter?: string;
    linkedin?: string;
  };
  avatarUrl?: string;
}

export interface UserPreferences {
  email: string;
  accountStatus: string;
  joinDate: string;
}

export interface NotificationSettings {
  competitions: boolean;
  quizzes: boolean;
  aiRecommendations: boolean;
  email: boolean;
  achievements: boolean;
  securityAlerts: boolean;
}

export interface SecurityEvent {
  id: string;
  event: string;
  ip: string;
  date: string;
}

export interface UserSession {
  id: string;
  device: string;
  browser: string;
  ip: string;
  lastActivity: string;
  isCurrent: boolean;
}

export interface PrivacySettings {
  profileVisibility: "PUBLIC" | "PRIVATE";
  leaderboardVisibility: boolean;
  competitionVisibility: boolean;
  analyticsSharing: boolean;
}

export interface ConnectedAccount {
  provider: "google" | "github" | "linkedin";
  email?: string;
  connected: boolean;
}

export interface AIPerferences {
  learningGoals: string;
  preferredCategories: string[];
  difficulty: "EASY" | "MEDIUM" | "HARD";
  recommendationsEnabled: boolean;
  interviewPrepEnabled: boolean;
}
