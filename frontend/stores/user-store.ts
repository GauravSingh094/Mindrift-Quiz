import { create } from 'zustand';
import { UserProfile } from '@/types';

interface UserState {
  profile: UserProfile | null;
  isAuthenticated: boolean;
  setProfile: (profile: UserProfile | null) => void;
  clear: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  isAuthenticated: false,
  setProfile: (profile) => set({ profile, isAuthenticated: !!profile }),
  clear: () => set({ profile: null, isAuthenticated: false }),
}));
export default useUserStore;
