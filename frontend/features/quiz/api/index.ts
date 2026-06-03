import { apiClient } from "@/lib/api-client";
import { Quiz, QuizAttempt } from "@/types";
import { QuizResultDetails } from "../types";
import { mockQuizzes } from "@/lib/mock-data";

// Fallback Mock results
const mockResults: Record<string, QuizResultDetails> = {
  "att_101": {
    attemptId: "att_101",
    quizId: "1",
    userId: "user_demo",
    score: 92,
    percentage: 92,
    accuracy: 92,
    timeTakenSeconds: 340,
    rank: 4,
    totalParticipants: 85,
    aiFeedback: "Excellent work! Your understanding of React Server Component hydration priorities is stellar. We detected slight efficiency gaps in asynchronous layout transitions. Review Suspense boundaries.",
    weakAreas: ["Suspense Boundaries", "Layer Hydration"],
    recommendations: ["Next.js Advanced Layouts Quiz", "RSC Server Actions Optimization"],
  },
};

export async function getQuizzes(): Promise<Quiz[]> {
  try {
    return await apiClient<Quiz[]>("/quizzes");
  } catch (err) {
    console.warn("⚠️ API offline: Returning mock quizzes list.", err);
    return mockQuizzes as unknown as Quiz[];
  }
}

export async function getQuizById(id: string): Promise<Quiz> {
  try {
    return await apiClient<Quiz>(`/quizzes/${id}`);
  } catch (err) {
    console.warn(`⚠️ API offline: Returning mock quiz details for id ${id}.`, err);
    const found = mockQuizzes.find((q) => q.id === id);
    if (!found) throw new Error("Quiz not found");
    return found as unknown as Quiz;
  }
}

interface StartAttemptPayload {
  quizId: string;
}

export async function startQuizAttempt(payload: StartAttemptPayload): Promise<QuizAttempt> {
  try {
    return await apiClient<QuizAttempt>("/attempts/start", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn("⚠️ API offline: Emulating local quiz attempt session.", err);
    return {
      id: `att_${Date.now()}`,
      quizId: payload.quizId,
      userId: "user_demo",
      score: 0,
      percentage: 0,
      completedAt: "",
      durationSeconds: 0,
      status: "STARTED",
    };
  }
}

interface AnswerPayload {
  attemptId: string;
  questionId: string;
  answerOptionId: string;
  answerText?: string;
  timeSpentSeconds?: number;
}

export async function submitQuestionAnswer(payload: AnswerPayload): Promise<{ success: boolean }> {
  try {
    return await apiClient<{ success: boolean }>("/attempts/answer", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn("⚠️ API offline: Logged answer locally.", err);
    return { success: true };
  }
}

interface SubmitAttemptPayload {
  attemptId: string;
  answers: Record<string, string>;
  warningsCount: number;
}

export async function submitQuizAttempt(payload: SubmitAttemptPayload): Promise<QuizAttempt> {
  try {
    return await apiClient<QuizAttempt>("/attempts/submit", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn("⚠️ API offline: Simulating custom complete submission.", err);
    return {
      id: payload.attemptId,
      quizId: "1",
      userId: "user_demo",
      score: 92,
      percentage: 92,
      completedAt: new Date().toISOString(),
      durationSeconds: 340,
      status: "COMPLETED",
    };
  }
}

export async function getAttemptResults(attemptId: string): Promise<QuizResultDetails> {
  try {
    return await apiClient<QuizResultDetails>(`/attempts/${attemptId}/results`);
  } catch (err) {
    console.warn(`⚠️ API offline: Loading mock fallback results for attempt ${attemptId}.`, err);
    return mockResults[attemptId] || {
      attemptId,
      quizId: "1",
      userId: "user_demo",
      score: 85,
      percentage: 85,
      accuracy: 85,
      timeTakenSeconds: 240,
      rank: 12,
      totalParticipants: 45,
      aiFeedback: "Solid performance. Strengthen your understanding of CSS specificity and grid alignment hierarchies.",
      weakAreas: ["CSS Grid", "Specificity rules"],
      recommendations: ["Grid Alignment Master Quiz", "Advanced Layout Flexbox"],
    };
  }
}

export async function getAttemptHistory(): Promise<QuizAttempt[]> {
  try {
    return await apiClient<QuizAttempt[]>("/attempts");
  } catch (err) {
    console.warn("⚠️ API offline: Returning mock history list.", err);
    return [
      {
        id: "att_101",
        quizId: "1",
        userId: "user_demo",
        score: 92,
        percentage: 92,
        completedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        durationSeconds: 340,
        status: "COMPLETED",
      },
      {
        id: "att_102",
        quizId: "2",
        userId: "user_demo",
        score: 75,
        percentage: 75,
        completedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
        durationSeconds: 420,
        status: "COMPLETED",
      },
    ];
  }
}
