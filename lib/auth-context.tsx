"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmail, 
  signUpWithEmail, 
  signOutUser, 
  getCurrentUserData,
  AuthUser 
} from './auth-service';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored user session on mount
  useEffect(() => {
    const checkStoredSession = async () => {
      try {
        const storedUser = localStorage.getItem('mindrift_user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        }
      } catch (error) {
        console.error('Error loading stored session:', error);
        localStorage.removeItem('mindrift_user');
      } finally {
        setIsLoading(false);
      }
    };

    checkStoredSession();
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const userData = await signInWithEmail(email, password);
      setUser(userData);
      localStorage.setItem('mindrift_user', JSON.stringify(userData));
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      const userData = await signUpWithEmail(email, password, name);
      setUser(userData);
      localStorage.setItem('mindrift_user', JSON.stringify(userData));
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setUser(null);
      localStorage.removeItem('mindrift_user');
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}