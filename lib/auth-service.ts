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

// Mock user database (in production, this would be a real database)
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
    lastLoginAt: new Date()
  }
});

// Simple password hashing (in production, use bcrypt or similar)
const hashPassword = (password: string): string => {
  return btoa(password); // Base64 encoding for demo purposes
};

const verifyPassword = (password: string, hash: string): boolean => {
  return btoa(password) === hash;
};

// Email/Password Sign In
export const signInWithEmail = async (email: string, password: string): Promise<AuthUser> => {
  try {
    console.log('🔐 Mock login attempt for:', email);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const userRecord = mockUsers.get(email.toLowerCase());
    
    if (!userRecord) {
      throw new Error('No account found with this email address.');
    }
    
    if (!verifyPassword(password, userRecord.password)) {
      throw new Error('Incorrect password. Please try again.');
    }
    
    // Update last login
    userRecord.user.lastLoginAt = new Date();
    
    console.log('✅ Mock login successful:', email);
    return userRecord.user;
  } catch (error) {
    console.error('❌ Mock login error:', error);
    throw error;
  }
};

// Email/Password Sign Up
export const signUpWithEmail = async (email: string, password: string, name: string): Promise<AuthUser> => {
  try {
    console.log('📝 Mock signup attempt for:', email);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (mockUsers.has(email.toLowerCase())) {
      throw new Error('An account with this email address already exists.');
    }
    
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }
    
    const newUser: AuthUser = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      email: email.toLowerCase(),
      provider: 'email',
      createdAt: new Date(),
      lastLoginAt: new Date()
    };
    
    mockUsers.set(email.toLowerCase(), {
      password: hashPassword(password),
      user: newUser
    });
    
    console.log('✅ Mock signup successful:', email);
    return newUser;
  } catch (error) {
    console.error('❌ Mock signup error:', error);
    throw error;
  }
};

// Sign Out
export const signOutUser = async (): Promise<void> => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('✅ Mock sign-out successful');
  } catch (error) {
    console.error('❌ Mock sign-out error:', error);
    throw new Error('Failed to sign out. Please try again.');
  }
};

// Get current user data (mock implementation)
export const getCurrentUserData = async (userId: string): Promise<AuthUser | null> => {
  try {
    // Find user by ID
    for (const [email, userRecord] of mockUsers.entries()) {
      if (userRecord.user.id === userId) {
        return userRecord.user;
      }
    }
    return null;
  } catch (error) {
    console.error('❌ Error getting user data:', error);
    return null;
  }
};