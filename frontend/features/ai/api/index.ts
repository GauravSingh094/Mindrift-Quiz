import { apiClient } from "@/lib/api-client";
import { GeneratedQuiz, LearningPath, InterviewSession, ChatMessage, SkillGapProfile, AIRecommendation } from "../types";
import { Question } from "@/types";

// Dynamic fallbacks when the backend Spring server is down (Task 15)
const mockSkillAnalysis: SkillGapProfile = {
  strengths: ["Docker Containerization", "Next.js Core Architecture", "Clerk Authentication"],
  weaknesses: ["Kafka Message Retention Configurations", "Prometheus Consul Discovery", "Java Multithread Locks"],
  resources: [
    { name: "Apache Kafka Operational Tuning Guide", url: "#", reason: "Addresses message retention lag parameters." },
    { name: "Prometheus Service Discovery Architectures", url: "#", reason: "Expands dynamic microservice target scrapes." },
    { name: "Java Concurrency & Multi-Thread Patterns", url: "#", reason: "Solves thread locking and semaphores errors." }
  ],
  scores: [
    { subject: "Docker/Swarm", score: 88, average: 65 },
    { subject: "Backend API", score: 72, average: 58 },
    { subject: "System Design", score: 65, average: 52 },
    { subject: "Message Queue", score: 45, average: 60 },
    { subject: "Monitoring", score: 50, average: 61 }
  ]
};

const mockRecommendations: AIRecommendation[] = [
  {
    id: "rec_1",
    type: "quiz",
    title: "Docker Swarm Advanced Cluster quiz",
    reason: "Your container sandbox proficiency places you close to elite standing. Take this test to verify Swarm details.",
    url: "/quizzes"
  },
  {
    id: "rec_2",
    type: "competition",
    title: "Kafka Event-Driven Architecture Arena",
    reason: "Your message queue score is currently below average. Participate in this live match to practice retention logs.",
    url: "/competitions"
  },
  {
    id: "rec_3",
    type: "path",
    title: "Zero-Downtime Swarm Clusters Roadmap",
    reason: "A 3-stage custom generated path focusing on high-availability DevOps.",
    url: "/ai/learning-paths"
  }
];

export async function getSkillGapProfile(): Promise<SkillGapProfile> {
  try {
    return await apiClient<SkillGapProfile>("/ai/skill-analysis");
  } catch (err) {
    console.warn("⚠️ API offline: Returning mock skill analysis profile.", err);
    return mockSkillAnalysis;
  }
}

export async function getAIRecommendations(): Promise<AIRecommendation[]> {
  try {
    return await apiClient<AIRecommendation[]>("/ai/recommendations");
  } catch (err) {
    console.warn("⚠️ API offline: Returning mock recommendations.", err);
    return mockRecommendations;
  }
}

export async function generateAIQuiz(topic: string, difficulty: string, count: number): Promise<GeneratedQuiz> {
  try {
    return await apiClient<GeneratedQuiz>("/ai/quiz-generator", {
      method: "POST",
      body: JSON.stringify({ topic, difficulty, count })
    });
  } catch (err) {
    console.warn("⚠️ API offline: Returning emulated AI generated quiz.", err);
    // Generate mock quiz questions on the subject
    const generatedQuestions: Question[] = Array.from({ length: count }).map((_, idx) => ({
      id: `gen_q_${idx + 1}`,
      questionText: `Under proctored conditions, how does ${topic} handle execution thread parameters at '${difficulty}' difficulty?`,
      points: 100,
      timeLimitSeconds: 90,
      options: [
        { id: `gen_o_${idx}_1`, optionText: `Optimistic parallel execution locking (profile ${idx + 1})` },
        { id: `gen_o_${idx}_2`, optionText: "Static allocation based on core constraints" },
        { id: `gen_o_${idx}_3`, optionText: "Dynamic round-robin scheduling queues" },
        { id: `gen_o_${idx}_4`, optionText: "None of the above parameters apply" }
      ]
    }));

    return {
      id: `gen_quiz_${Math.floor(Math.random() * 10000)}`,
      topic,
      difficulty: difficulty as any,
      questionCount: count,
      questions: generatedQuestions,
      createdAt: new Date().toISOString()
    };
  }
}

export async function generateLearningPath(topic: string, goal: string): Promise<LearningPath> {
  try {
    return await apiClient<LearningPath>("/ai/learning-path", {
      method: "POST",
      body: JSON.stringify({ topic, goal })
    });
  } catch (err) {
    console.warn("⚠️ API offline: Returning emulated learning path.", err);
    return {
      id: `gen_path_${Math.floor(Math.random() * 10000)}`,
      title: `AI Masterclass: ${topic} Engineering Path`,
      topic,
      estimatedWeeks: 4,
      createdAt: new Date().toISOString(),
      milestones: [
        {
          id: "m_1",
          title: "Stage 1: Core Mechanics and Scaffolding",
          description: `Master fundamental commands and configurations of ${topic} to support goal: '${goal}'.`,
          resources: ["Official Documentation Core Guides", "Mindrift Playground Sandbox"],
          completed: false
        },
        {
          id: "m_2",
          title: "Stage 2: Dynamic Orchestrations & Sharding",
          description: "Analyze thread synchronization limits, multi-host volumes, and Kafka cluster topologies.",
          resources: ["Container Network Topologies whitepaper", "Kafka Broker Operational Logs"],
          completed: false
        },
        {
          id: "m_3",
          title: "Stage 3: Advanced Optimization & Proctor Tuning",
          description: "Implement Consul scraper integrations, metric queries, and anti-cheat telemetry filters.",
          resources: ["Prometheus Scraper tuning guides", "Clerk JWT validations specs"],
          completed: false
        }
      ]
    };
  }
}

export async function createInterviewSession(role: string, difficulty: string): Promise<InterviewSession> {
  try {
    return await apiClient<InterviewSession>("/ai/interview", {
      method: "POST",
      body: JSON.stringify({ role, difficulty })
    });
  } catch (err) {
    console.warn("⚠️ API offline: Initiating emulated interview simulator.", err);
    return {
      id: `gen_int_${Math.floor(Math.random() * 10000)}`,
      role,
      difficulty: difficulty as any,
      status: "STARTED",
      activeQuestionIndex: 0,
      createdAt: new Date().toISOString(),
      QA: [
        { question: `Question 1: Explain Suspense hydration priorities inside Next.js concurrent environments as a ${role}.` },
        { question: `Question 2: How do you design high-availability Postgres clusters using Consul service discoveries as a ${role}?` },
        { question: `Question 3: Describe dynamic anti-cheat telemetry switch flags architectures in Clerk context.` }
      ]
    };
  }
}

export async function sendInterviewAnswer(sessionId: string, questionIndex: number, answer: string): Promise<{ feedback: string; score: number }> {
  try {
    return await apiClient<{ feedback: string; score: number }>(`/ai/interview/${sessionId}/grade`, {
      method: "POST",
      body: JSON.stringify({ questionIndex, answer })
    });
  } catch (err) {
    console.warn("⚠️ API offline: Returning emulated answer feedback.", err);
    return {
      feedback: "Answer received. Telemetry check confirms clear, detailed terminology. Minor latency tweaks recommended.",
      score: 85 + Math.floor(Math.random() * 10)
    };
  }
}

export async function sendAIChatMessage(messageText: string): Promise<string> {
  try {
    const res = await apiClient<{ response: string }>("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message: messageText })
    });
    return res.response;
  } catch (err) {
    console.warn("⚠️ API offline: Emulating AI Chat Assistant response.", err);
    // Simple prompt template mapping responses
    const txt = messageText.toLowerCase();
    if (txt.includes("docker") || txt.includes("swarm")) {
      return "Docker Swarm leverages a decentralized ingress routing mesh. To guarantee dynamic service updates without downtime, map your constraints to rolling update parallel scales (e.g. `--update-parallelism 1`) and monitor Consul scrapes.";
    }
    if (txt.includes("kafka") || txt.includes("message")) {
      return "Apache Kafka brokers persist commit logs based on time duration (`log.retention.hours`) or total segments bytes limits. Set offsets commits properly in Java threading locks to protect consistency.";
    }
    return "Understood. The Mindrift AI Engine highlights optimizing container sandbox security, JWT security signatures checking, and microservices service discoveries. Ask me details about any specific system architectural patterns!";
  }
}
