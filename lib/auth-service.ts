// Mock Authentication Service (replaces Firebase Auth)

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider?: string;
  createdAt?: Date;
  lastLoginAt?: Date;
}

// Mock user database (in production, use a real DB)
const mockUsers: Map<string, { password: string; user: AuthUser }> = new Map();

// Demo user for testing
mockUsers.set('demo@mindrift.com', {
  password: 'demo123',
  user: {
    id: 'demo-user-1',
    name: 'Demo User',
    email: 'demo@mindrift.com',
    provider: 'email',
    createdAt: new Date(),
    lastLoginAt: new Date(),
  },
});

// Simple password hashing (use bcrypt in production)
const hashPassword = (password: string): string => btoa(password);
const verifyPassword = (password: string, hash: string): boolean => btoa(password) === hash;

// Email/Password Sign In
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<AuthUser> => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const userRecord = mockUsers.get(email.toLowerCase());

  if (!userRecord) throw new Error('No account found with this email.');
  if (!verifyPassword(password, userRecord.password))
    throw new Error('Incorrect password.');

  userRecord.user.lastLoginAt = new Date();
  return userRecord.user;
};

// Email/Password Sign Up
export const signUpWithEmail = async (
  email: string,
  password: string,
  name: string
): Promise<AuthUser> => {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  if (mockUsers.has(email.toLowerCase()))
    throw new Error('Email already in use.');
  if (password.length < 6)
    throw new Error('Password must be at least 6 characters.');

  const newUser: AuthUser = {
    id: `user-${Date.now()}`,
    name: name.trim(),
    email: email.toLowerCase(),
    provider: 'email',
    createdAt: new Date(),
    lastLoginAt: new Date(),
  };

  mockUsers.set(email.toLowerCase(), {
    password: hashPassword(password),
    user: newUser,
  });

  return newUser;
};

// Sign Out
export const signOutUser = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  console.log('✅ Mock sign-out successful');
};

// Get current user data
export const getCurrentUserData = async (
  userId: string
): Promise<AuthUser | null> => {
  for (const [, userRecord] of mockUsers.entries()) {
    if (userRecord.user.id === userId) {
      return userRecord.user;
    }
  }
  return null;
};
