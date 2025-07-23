// Mock Authentication Service (No Firebase Used)

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider?: string;
  createdAt?: Date;
  lastLoginAt?: Date;
}

// Mock user database (in production, this would be a real database)
const mockUsers: Map<string, { password: string; user: AuthUser }> = new Map();

// Demo user for testing
mockUsers.set('demo@mindrift.com', {
  password: 'ZGVtbzEyMw==', // base64 encoded: demo123
  user: {
    id: 'demo-user-1',
    name: 'Demo User',
    email: 'demo@mindrift.com',
    provider: 'email',
    createdAt: new Date(),
    lastLoginAt: new Date(),
  },
});

// Simple password hashing (for demo only)
const hashPassword = (password: string): string => {
  return btoa(password); // Use bcrypt in production
};

const verifyPassword = (password: string, hash: string): boolean => {
  return btoa(password) === hash;
};

// Email/Password Sign In
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<AuthUser> => {
  try {
    console.log('🔐 Mock login attempt for:', email);

    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate delay

    const record = mockUsers.get(email.toLowerCase());
    if (!record) throw new Error('No account found with this email.');

    if (!verifyPassword(password, record.password))
      throw new Error('Incorrect password.');

    record.user.lastLoginAt = new Date();
    console.log('✅ Login successful:', email);
    return record.user;
  } catch (error) {
    console.error('❌ Login error:', error);
    throw error;
  }
};

// Email/Password Sign Up
export const signUpWithEmail = async (
  email: string,
  password: string,
  name: string
): Promise<AuthUser> => {
  try {
    console.log('📝 Mock signup attempt for:', email);

    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate delay

    if (mockUsers.has(email.toLowerCase()))
      throw new Error('User already exists.');

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

    console.log('✅ Signup successful:', email);
    return newUser;
  } catch (error) {
    console.error('❌ Signup error:', error);
    throw error;
  }
};

// Sign Out
export const signOutUser = async (): Promise<void> => {
  try {
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate delay
    console.log('✅ User signed out.');
  } catch (error) {
    console.error('❌ Sign-out error:', error);
    throw new Error('Failed to sign out.');
  }
};

// Get Current User Data
export const getCurrentUserData = async (
  userId: string
): Promise<AuthUser | null> => {
  try {
    for (const { user } of mockUsers.values()) {
      if (user.id === userId) return user;
    }
    return null;
  } catch (error) {
    console.error('❌ Get user error:', error);
    return null;
  }
};
