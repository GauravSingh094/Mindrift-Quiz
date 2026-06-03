import { create } from 'zustand';

interface UIState {
  activeQuizId: string | null;
  setActiveQuizId: (quizId: string | null) => void;
  isCreateModalOpen: boolean;
  setCreateModalOpen: (isOpen: boolean) => void;
  toastMessage: string | null;
  setToastMessage: (message: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeQuizId: null,
  setActiveQuizId: (activeQuizId) => set({ activeQuizId }),
  isCreateModalOpen: false,
  setCreateModalOpen: (isCreateModalOpen) => set({ isCreateModalOpen }),
  toastMessage: null,
  setToastMessage: (toastMessage) => set({ toastMessage }),
}));
export default useUIStore;
