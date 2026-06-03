import { create } from "zustand";
import { CompetitionParticipant, CompetitionLobby } from "../types";

interface CompetitionStoreState {
  // Lobby and WS Live states
  lobby: CompetitionLobby | null;
  liveParticipants: CompetitionParticipant[];
  leaderboard: CompetitionParticipant[];
  warningsCount: number;
  announcements: string[];
  socketConnected: boolean;

  // Active Live Attempt states
  attemptId: string;
  quizId: string;
  questions: any[];
  currentQuestionIndex: number;
  answers: Record<string, string>;
  flags: Record<string, boolean>;
  timeRemainingSeconds: number;
  status: "LOBBY" | "LIVE" | "SUBMITTED" | "TIME_OUT";
  tabSwitchesCount: number;
  copyPasteAttemptsCount: number;
  fullscreenExitsCount: number;
  isFocusModeActive: boolean;
  
  setLobby: (lobby: CompetitionLobby) => void;
  updatePresence: (participants: { userId: string; name: string; ready: boolean }[]) => void;
  addAnnouncement: (announcement: string) => void;
  updateParticipantScore: (userId: string, score: number, questionsAnswered: number, timeSpent: number) => void;
  setLeaderboard: (leaderboard: CompetitionParticipant[]) => void;
  incrementWarning: () => void;
  setSocketConnected: (connected: boolean) => void;
  
  // Live Attempt Actions
  startAttempt: (params: {
    attemptId: string;
    quizId: string;
    questions: any[];
    timeLimitSeconds: number;
  }) => void;
  answerQuestion: (questionId: string, answer: string) => void;
  toggleFlag: (questionId: string) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  jumpToQuestion: (index: number) => void;
  tickTimer: () => void;
  addWarning: (type: "TAB_SWITCH" | "COPY_PASTE" | "FULLSCREEN_EXIT", message: string) => void;
  setFocusMode: (active: boolean) => void;
  completeAttempt: () => void;
  
  clearStore: () => void;
}

export const useCompetitionStore = create<CompetitionStoreState>((set) => ({
  // Defaults
  lobby: null,
  liveParticipants: [],
  leaderboard: [],
  warningsCount: 0,
  announcements: [
    "Welcome to the Arena. Please accept terms and stay in focus mode.",
    "Proctored locks are active: tab switching or cut/copy/paste commands are flagged.",
  ],
  socketConnected: false,

  attemptId: "",
  quizId: "",
  questions: [],
  currentQuestionIndex: 0,
  answers: {},
  flags: {},
  timeRemainingSeconds: 0,
  status: "LOBBY",
  tabSwitchesCount: 0,
  copyPasteAttemptsCount: 0,
  fullscreenExitsCount: 0,
  isFocusModeActive: false,

  setLobby: (lobby) => set({ lobby }),
  
  updatePresence: (participants) =>
    set((state) => {
      if (!state.lobby) return {};
      return {
        lobby: {
          ...state.lobby,
          participants: participants.map((p) => ({
            userId: p.userId,
            name: p.name,
            ready: p.ready,
          })),
        },
      };
    }),

  addAnnouncement: (announcement) =>
    set((state) => ({
      announcements: [announcement, ...state.announcements],
    })),

  updateParticipantScore: (userId, score, questionsAnswered, timeSpent) =>
    set((state) => {
      const updatedParticipants = state.liveParticipants.map((p) =>
        p.userId === userId
          ? { ...p, score, questionsAnswered, timeSpentSeconds: timeSpent }
          : p
      );
      return { liveParticipants: updatedParticipants };
    }),

  setLeaderboard: (leaderboard) =>
    set({
      leaderboard: [...leaderboard].sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.timeSpentSeconds - b.timeSpentSeconds;
      }),
    }),

  incrementWarning: () =>
    set((state) => ({
      warningsCount: state.warningsCount + 1,
    })),

  setSocketConnected: (connected) => set({ socketConnected: connected }),

  // Live Attempt Actions implementation
  startAttempt: ({ attemptId, quizId, questions, timeLimitSeconds }) =>
    set({
      attemptId,
      quizId,
      questions,
      currentQuestionIndex: 0,
      answers: {},
      flags: {},
      timeRemainingSeconds: timeLimitSeconds,
      status: "LIVE",
      warningsCount: 0,
      tabSwitchesCount: 0,
      copyPasteAttemptsCount: 0,
      fullscreenExitsCount: 0,
      isFocusModeActive: true,
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
        status: nextTime === 0 ? "TIME_OUT" : state.status,
      };
    }),

  addWarning: (type, message) =>
    set((state) => {
      let tabSwitches = state.tabSwitchesCount;
      let copyPaste = state.copyPasteAttemptsCount;
      let fullscreenExits = state.fullscreenExitsCount;

      if (type === "TAB_SWITCH") tabSwitches += 1;
      if (type === "COPY_PASTE") copyPaste += 1;
      if (type === "FULLSCREEN_EXIT") fullscreenExits += 1;

      return {
        warningsCount: state.warningsCount + 1,
        tabSwitchesCount: tabSwitches,
        copyPasteAttemptsCount: copyPaste,
        fullscreenExitsCount: fullscreenExits,
      };
    }),

  setFocusMode: (active) => set({ isFocusModeActive: active }),

  completeAttempt: () => set({ status: "SUBMITTED" }),

  clearStore: () =>
    set({
      lobby: null,
      liveParticipants: [],
      leaderboard: [],
      warningsCount: 0,
      announcements: [
        "Welcome to the Arena. Please accept terms and stay in focus mode.",
        "Proctored locks are active: tab switching or cut/copy/paste commands are flagged.",
      ],
      socketConnected: false,
      attemptId: "",
      quizId: "",
      questions: [],
      currentQuestionIndex: 0,
      answers: {},
      flags: {},
      timeRemainingSeconds: 0,
      status: "LOBBY",
      tabSwitchesCount: 0,
      copyPasteAttemptsCount: 0,
      fullscreenExitsCount: 0,
      isFocusModeActive: false,
    }),
}));

export default useCompetitionStore;
