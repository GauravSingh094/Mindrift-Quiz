import { create } from "zustand";
import { ChatMessage, GeneratedQuiz, LearningPath, InterviewSession, AIRecommendation } from "../types";

interface AIStoreState {
  conversations: ChatMessage[];
  generatedQuiz: GeneratedQuiz | null;
  learningPaths: LearningPath[];
  recommendations: AIRecommendation[];
  interviewSession: InterviewSession | null;
  
  // History collections
  historyQuizzes: GeneratedQuiz[];
  historyPaths: LearningPath[];
  historyInterviews: InterviewSession[];

  // Actions
  addChatMessage: (msg: ChatMessage) => void;
  setGeneratedQuiz: (quiz: GeneratedQuiz | null) => void;
  addLearningPath: (path: LearningPath) => void;
  toggleMilestone: (pathId: string, milestoneId: string) => void;
  setRecommendations: (recs: AIRecommendation[]) => void;
  
  // Interview Actions
  startInterview: (session: InterviewSession) => void;
  answerInterviewQuestion: (answer: string) => void;
  gradeInterviewQuestion: (index: number, feedback: string, score: number) => void;
  nextInterviewQuestion: () => void;
  completeInterview: () => void;

  clearStore: () => void;
}

export const useAIStore = create<AIStoreState>((set) => ({
  conversations: [
    {
      id: "init",
      role: "assistant",
      text: "Hello! I am your Mindrift AI mentor. How can I accelerate your engineering journey today?",
      timestamp: new Date().toLocaleTimeString()
    }
  ],
  generatedQuiz: null,
  learningPaths: [],
  recommendations: [],
  interviewSession: null,
  historyQuizzes: [],
  historyPaths: [],
  historyInterviews: [],

  addChatMessage: (msg) =>
    set((state) => ({
      conversations: [...state.conversations, msg]
    })),

  setGeneratedQuiz: (generatedQuiz) =>
    set((state) => {
      const nextHistory = generatedQuiz 
        ? [generatedQuiz, ...state.historyQuizzes] 
        : state.historyQuizzes;
      return { generatedQuiz, historyQuizzes: nextHistory };
    }),

  addLearningPath: (path) =>
    set((state) => ({
      learningPaths: [path, ...state.learningPaths],
      historyPaths: [path, ...state.historyPaths]
    })),

  toggleMilestone: (pathId, milestoneId) =>
    set((state) => {
      const updated = state.learningPaths.map((p) => {
        if (p.id === pathId) {
          const milestones = p.milestones.map((m) =>
            m.id === milestoneId ? { ...m, completed: !m.completed } : m
          );
          return { ...p, milestones };
        }
        return p;
      });
      return { learningPaths: updated };
    }),

  setRecommendations: (recommendations) => set({ recommendations }),

  startInterview: (interviewSession) =>
    set((state) => ({
      interviewSession,
      historyInterviews: [interviewSession, ...state.historyInterviews]
    })),

  answerInterviewQuestion: (answer) =>
    set((state) => {
      if (!state.interviewSession) return {};
      const session = state.interviewSession;
      const updatedQA = [...session.QA];
      updatedQA[session.activeQuestionIndex] = {
        ...updatedQA[session.activeQuestionIndex],
        answer
      };
      return {
        interviewSession: {
          ...session,
          QA: updatedQA
        }
      };
    }),

  gradeInterviewQuestion: (index, feedback, score) =>
    set((state) => {
      if (!state.interviewSession) return {};
      const session = state.interviewSession;
      const updatedQA = [...session.QA];
      updatedQA[index] = {
        ...updatedQA[index],
        feedback,
        score
      };
      return {
        interviewSession: {
          ...session,
          QA: updatedQA
        }
      };
    }),

  nextInterviewQuestion: () =>
    set((state) => {
      if (!state.interviewSession) return {};
      const session = state.interviewSession;
      return {
        interviewSession: {
          ...session,
          activeQuestionIndex: session.activeQuestionIndex + 1
        }
      };
    }),

  completeInterview: () =>
    set((state) => {
      if (!state.interviewSession) return {};
      return {
        interviewSession: {
          ...state.interviewSession,
          status: "COMPLETED"
        }
      };
    }),

  clearStore: () =>
    set({
      conversations: [
        {
          id: "init",
          role: "assistant",
          text: "Hello! I am your Mindrift AI mentor. How can I accelerate your engineering journey today?",
          timestamp: new Date().toLocaleTimeString()
        }
      ],
      generatedQuiz: null,
      learningPaths: [],
      recommendations: [],
      interviewSession: null,
      historyQuizzes: [],
      historyPaths: [],
      historyInterviews: []
    })
}));

export default useAIStore;
