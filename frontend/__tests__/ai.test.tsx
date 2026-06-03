import { useAIStore } from "../features/ai/store/ai-store";
import { generateAIQuiz, generateLearningPath, createInterviewSession, sendInterviewAnswer, sendAIChatMessage } from "../features/ai/api";

describe("Mindrift F9 AI Hub & Personalized Learning Core Unit Test Suite", () => {
  beforeEach(() => {
    useAIStore.getState().clearStore();
  });

  describe("Zustand AI Store Management", () => {
    test("should append chat messages and preserve dialogue context", () => {
      const initStore = useAIStore.getState();
      expect(initStore.conversations.length).toBe(1);

      useAIStore.getState().addChatMessage({
        id: "msg_1",
        role: "user",
        text: "Explain rolling Swarm updates",
        timestamp: "12:00 PM"
      });

      const updated = useAIStore.getState();
      expect(updated.conversations.length).toBe(2);
      expect(updated.conversations[1].text).toBe("Explain rolling Swarm updates");
    });

    test("should load generated quiz sandboxes and append to history lists", () => {
      const mockQuiz = {
        id: "gen_test_99",
        topic: "Kubernetes Ingress",
        difficulty: "HARD" as const,
        questionCount: 1,
        questions: [],
        createdAt: new Date().toISOString()
      };

      useAIStore.getState().setGeneratedQuiz(mockQuiz);

      const state = useAIStore.getState();
      expect(state.generatedQuiz?.id).toBe("gen_test_99");
      expect(state.historyQuizzes.length).toBe(1);
    });

    test("should append learning roadmaps and toggle milestones complete states", () => {
      const mockPath = {
        id: "path_test_99",
        title: "Docker Architect Path",
        topic: "Docker Swarm",
        estimatedWeeks: 4,
        createdAt: new Date().toISOString(),
        milestones: [
          { id: "m_1", title: "Core commands", description: "Learn docker swarm init", resources: [], completed: false }
        ]
      };

      useAIStore.getState().addLearningPath(mockPath);
      
      const state = useAIStore.getState();
      expect(state.learningPaths.length).toBe(1);
      expect(state.learningPaths[0].milestones[0].completed).toBe(false);

      // Toggle milestone state
      useAIStore.getState().toggleMilestone("path_test_99", "m_1");
      
      const updated = useAIStore.getState();
      expect(updated.learningPaths[0].milestones[0].completed).toBe(true);
    });

    test("should coordinate simulated interview sessions grading and QA logs", () => {
      const mockInterview = {
        id: "int_test_99",
        role: "Frontend Architect",
        difficulty: "SENIOR" as const,
        status: "STARTED" as const,
        activeQuestionIndex: 0,
        createdAt: new Date().toISOString(),
        QA: [
          { question: "Q1: Explain React Suspense" }
        ]
      };

      useAIStore.getState().startInterview(mockInterview);

      const state = useAIStore.getState();
      expect(state.interviewSession?.id).toBe("int_test_99");
      expect(state.interviewSession?.QA[0].answer).toBeUndefined();

      // Answer question
      useAIStore.getState().answerInterviewQuestion("I use Suspense boundary blocks.");
      useAIStore.getState().gradeInterviewQuestion(0, "Clear technical response.", 90);

      const answeredState = useAIStore.getState();
      expect(answeredState.interviewSession?.QA[0].answer).toBe("I use Suspense boundary blocks.");
      expect(answeredState.interviewSession?.QA[0].score).toBe(90);
    });
  });

  describe("API Client Emulation Testing", () => {
    test("generateAIQuiz yields topic compiler payloads", async () => {
      const quiz = await generateAIQuiz("Kafka Brokers", "HARD", 3);
      expect(quiz.topic).toBe("Kafka Brokers");
      expect(quiz.questionCount).toBe(3);
      expect(quiz.questions.length).toBe(3);
    });

    test("generateLearningPath yields roadmaps milestones", async () => {
      const path = await generateLearningPath("Next.js App Router", "Deploy dynamic microservice");
      expect(path.topic).toBe("Next.js App Router");
      expect(path.milestones.length).toBeGreaterThan(0);
    });

    test("createInterviewSession and grade answer returns valid feedback", async () => {
      const session = await createInterviewSession("Solutions Architect", "SENIOR");
      expect(session.QA.length).toBeGreaterThan(0);

      const grade = await sendInterviewAnswer(session.id, 0, "My design mounts Swarm nodes.");
      expect(grade.score).toBeGreaterThan(0);
      expect(grade.feedback).toBeDefined();
    });

    test("sendAIChatMessage yields conversational mentor assistance responses", async () => {
      const reply = await sendAIChatMessage("Explain Docker swarm rolling updates parameters.");
      expect(reply).toContain("Docker Swarm");
    });
  });
});
