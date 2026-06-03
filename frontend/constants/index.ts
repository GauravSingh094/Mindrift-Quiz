export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGN_UP: '/sign-up',
  DASHBOARD: '/dashboard',
  QUIZZES: '/quizzes',
  CREATE_QUIZ: '/quizzes/create',
  LEADERBOARD: '/leaderboard',
  COMPETITIONS: '/competitions',
  ANALYTICS: '/analytics',
  PROFILE: '/profile',
} as const;

export const ROLES = {
  ADMIN: 'ROLE_ADMIN',
  CREATOR: 'ROLE_CREATOR',
  USER: 'ROLE_USER',
} as const;

export const PERMISSIONS = {
  CREATE_QUIZ: 'quiz:create',
  EDIT_QUIZ: 'quiz:edit',
  DELETE_QUIZ: 'quiz:delete',
  VIEW_ANALYTICS: 'analytics:view',
  MANAGE_USERS: 'users:manage',
} as const;

export const THEME = {
  DARK: 'dark',
  LIGHT: 'light',
  SYSTEM: 'system',
} as const;
