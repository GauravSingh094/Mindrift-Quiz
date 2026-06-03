import { create } from "zustand";
import { QuizAttemptState, AntiCheatWarning } from "../types";
import { Question } from "@/types";

interface QuizStoreState extends QuizAttemptState {
  questions: Question[];
  startAttempt: (params: {
    attemptId: string;
    quizId: string;
    questions: Question[];
    timeLimitSeconds: number;
  }) => void;
  answerQuestion: (questionId: string, answer: string) => void;
  toggleFlag: (questionId: string) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  jumpToQuestion: (index: number) => void;
  tickTimer: () => void;
  addWarning: (type: AntiCheatWarning["type"], message: string) => void;
  setFocusMode: (active: boolean) => void;
  completeAttempt: () => void;
  clearStore: () => void;
}

export const useQuizStore = create<QuizStoreState>((set) => ({
  attemptId: "",
  quizId: "",
  questions: [],
  currentQuestionIndex: 0,
  answers: {},
  flags: {},
  timeRemainingSeconds: 0,
  warnings: [],
  tabSwitchesCount: 0,
  copyPasteAttemptsCount: 0,
  fullscreenExitsCount: 0,
  isFocusModeActive: false,
  status: "STARTED",

  startAttempt: ({ attemptId, quizId, questions, timeLimitSeconds }) =>
    set({
      attemptId,
      quizId,
      questions,
      currentQuestionIndex: 0,
      answers: {},
      flags: {},
      timeRemainingSeconds: timeLimitSeconds,
      warnings: [],
      tabSwitchesCount: 0,
      copyPasteAttemptsCount: 0,
      fullscreenExitsCount: 0,
      isFocusModeActive: false,
      status: "STARTED",
    }),

  answerQuestion: (questionId, answer) =>
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: answer,
      },
    })),

  toggleFlag: (questionId) =>
    set((state) => ({
      flags: {
        ...state.flags,
        [questionId]: !state.flags[questionId],
      },
    })),

  nextQuestion: () =>
    set((state) => ({
      currentQuestionIndex: Math.min(
        state.currentQuestionIndex + 1,
        state.questions.length - 1
      ),
    })),

  prevQuestion: () =>
    set((state) => ({
      currentQuestionIndex: Math.max(state.currentQuestionIndex - 1, 0),
    })),

  jumpToQuestion: (index) =>
    set((state) => ({
      currentQuestionIndex: Math.max(
        0,
        Math.min(index, state.questions.length - 1)
      ),
    })),

  tickTimer: () =>
    set((state) => {
      const nextTime = Math.max(state.timeRemainingSeconds - 1, 0);
      return {
        timeRemainingSeconds: nextTime,
        status: nextTime === 0 ? "EXPIRED" : state.status,
      };
    }),

  addWarning: (type, message) =>
    set((state) => {
      const newWarning: AntiCheatWarning = {
        type,
        message,
        timestamp: new Date().toLocaleTimeString(),
      };
      
      let tabSwitchesCount = state.tabSwitchesCount;
      let copyPasteAttemptsCount = state.copyPasteAttemptsCount;
      let fullscreenExitsCount = state.fullscreenExitsCount;

      if (type === "TAB_SWITCH") tabSwitchesCount += 1;
      if (type === "CLIPBOARD_COPY" || type === "CLIPBOARD_PASTE") copyPasteAttemptsCount += 1;
      if (type === "FULLSCREEN_EXIT") fullscreenExitsCount += 1;

      return {
        warnings: [newWarning, ...state.warnings],
        tabSwitchesCount,
        copyPasteAttemptsCount,
        fullscreenExitsCount,
      };
    }),

  setFocusMode: (active) => set({ isFocusModeActive: active }),

  completeAttempt: () => set({ status: "COMPLETED" }),

  clearStore: () =>
    set({
      attemptId: "",
      quizId: "",
      questions: [],
      currentQuestionIndex: 0,
      answers: {},
      flags: {},
      timeRemainingSeconds: 0,
      warnings: [],
      tabSwitchesCount: 0,
      copyPasteAttemptsCount: 0,
      fullscreenExitsCount: 0,
      isFocusModeActive: false,
      status: "STARTED",
    }),
}));

export default useQuizStore;
