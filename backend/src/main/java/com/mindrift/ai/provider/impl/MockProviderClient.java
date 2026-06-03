package com.mindrift.ai.provider.impl;

import com.mindrift.ai.entity.AIProvider;
import com.mindrift.ai.provider.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Mock provider for dev/test environments.
 *
 * Always available. Returns deterministic JSON based on request type.
 * Activated automatically when no real provider is configured.
 */
@Slf4j
@Component
public class MockProviderClient implements AIProviderClient {

    @Override
    public AIProvider provider() { return AIProvider.MOCK; }

    @Override
    public boolean isAvailable() { return true; }

    @Override
    public AIProviderResponse call(AIProviderRequest request) {
        log.info("MockProvider: handling {} request", request.getRequestType());

        String mockJson = switch (request.getRequestType()) {
            case QUIZ_GENERATION, QUESTION_GENERATION -> mockQuizJson();
            case ANSWER_EXPLANATION, CONCEPT_EXPLANATION -> mockExplanationJson();
            case SKILL_GAP_ANALYSIS -> mockSkillGapJson();
            case LEARNING_PATH_GENERATION -> mockLearningPathJson();
            case INTERVIEW_QUESTION -> mockInterviewQuestionJson();
            case INTERVIEW_EVALUATION -> mockInterviewEvalJson();
            case INTERVIEW_FEEDBACK -> mockInterviewFeedbackJson();
            case QUIZ_RECOMMENDATION, CONTENT_RECOMMENDATION -> mockRecommendationJson();
            default -> "{\"result\":\"mock\"}";
        };

        return AIProviderResponse.builder()
                .provider(AIProvider.MOCK)
                .rawText(mockJson)
                .parsedJson(mockJson)
                .promptTokens(150)
                .completionTokens(350)
                .totalTokens(500)
                .latencyMs(50L)
                .finishReason("stop")
                .modelUsed("mock-model-v1")
                .build();
    }

    // ─── Mock responses ──────────────────────────────────────────────────────

    private String mockQuizJson() {
        return """
            {
              "title": "Mock Quiz: Introduction to Java",
              "description": "A beginner-friendly quiz covering Java fundamentals.",
              "estimatedDurationMinutes": 15,
              "questions": [
                {
                  "text": "What is the size of an int in Java?",
                  "options": ["16 bits","32 bits","64 bits","8 bits"],
                  "correctOptionIndex": 1,
                  "explanation": "Java int is a 32-bit signed two's complement integer.",
                  "difficulty": "EASY",
                  "tags": ["java","primitive-types"]
                },
                {
                  "text": "Which keyword is used to inherit a class in Java?",
                  "options": ["implement","inherits","extends","super"],
                  "correctOptionIndex": 2,
                  "explanation": "The 'extends' keyword is used to create a subclass.",
                  "difficulty": "EASY",
                  "tags": ["java","oop"]
                }
              ]
            }
            """;
    }

    private String mockExplanationJson() {
        return """
            {
              "explanation": "This is the correct answer because the concept is well established in the domain.",
              "conceptSummary": "Brief summary of the underlying concept.",
              "keyPoints": ["Point 1", "Point 2", "Point 3"],
              "furtherReading": ["https://docs.example.com/concept"]
            }
            """;
    }

    private String mockSkillGapJson() {
        return """
            {
              "overallLevel": "INTERMEDIATE",
              "gaps": [
                {"category": "Data Structures", "currentLevel": 45, "targetLevel": 75, "priority": "HIGH"},
                {"category": "Algorithms", "currentLevel": 55, "targetLevel": 80, "priority": "MEDIUM"}
              ],
              "strengths": ["Java Syntax", "OOP Concepts"],
              "summary": "You have a solid foundation but need improvement in algorithms."
            }
            """;
    }

    private String mockLearningPathJson() {
        return """
            {
              "title": "Master Data Structures",
              "description": "A 4-week path to strengthen your data structures knowledge.",
              "estimatedHours": 40,
              "difficulty": "INTERMEDIATE",
              "milestones": [
                {
                  "milestoneIndex": 1,
                  "title": "Arrays and Strings",
                  "description": "Master fundamental array operations",
                  "topics": ["Arrays","String manipulation","2D arrays"],
                  "estimatedHours": 8
                },
                {
                  "milestoneIndex": 2,
                  "title": "Linked Lists and Stacks",
                  "description": "Understand pointer-based structures",
                  "topics": ["Singly linked list","Doubly linked list","Stack","Queue"],
                  "estimatedHours": 10
                }
              ]
            }
            """;
    }

    private String mockInterviewQuestionJson() {
        return """
            {
              "question": "Explain the difference between HashMap and TreeMap in Java.",
              "followUpHints": ["Ask about time complexity", "Probe on ordering"],
              "expectedKeyPoints": ["HashMap O(1) avg", "TreeMap O(log n)", "TreeMap sorted"],
              "difficulty": "MEDIUM"
            }
            """;
    }

    private String mockInterviewEvalJson() {
        return """
            {
              "score": 75,
              "technicalAccuracy": 80,
              "communication": 70,
              "completeness": 75,
              "feedback": "Good understanding of the basics. Missed discussion of thread safety.",
              "missedPoints": ["Thread safety", "Null key handling in HashMap"]
            }
            """;
    }

    private String mockInterviewFeedbackJson() {
        return """
            {
              "overallScore": 72,
              "technicalScore": 76,
              "communicationScore": 68,
              "problemSolvingScore": 72,
              "summary": "Solid performance with good fundamentals. Work on articulating complex concepts.",
              "strengths": ["Java core knowledge", "OOP principles", "Problem decomposition"],
              "improvements": ["System design", "Concurrency concepts", "Communication clarity"]
            }
            """;
    }

    private String mockRecommendationJson() {
        return """
            {
              "rationale": "Based on your recent performance in Java quizzes, we recommend strengthening data structures.",
              "items": [
                {"rank": 1, "entityType": "QUIZ", "title": "Data Structures Deep Dive", "reason": "Matches identified skill gap", "confidenceScore": 0.92},
                {"rank": 2, "entityType": "QUIZ", "title": "Algorithm Patterns", "reason": "Complements your current level", "confidenceScore": 0.85}
              ]
            }
            """;
    }
}
