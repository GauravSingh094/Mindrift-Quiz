package com.mindrift.ai.service;

import com.mindrift.ai.entity.AIRequestType;
import org.springframework.stereotype.Component;

/**
 * Centralised prompt template registry.
 *
 * All prompts instruct the AI to respond with valid JSON only.
 * Templates use {PLACEHOLDER} syntax resolved by PromptBuilder.
 *
 * Design principles:
 *   - Every prompt ends with a strict JSON schema definition
 *   - System prompt establishes role; user prompt provides specifics
 *   - Temperature guidance embedded via comments in schema
 */
@Component
public class PromptTemplateService {

    // ─── System prompts ───────────────────────────────────────────────────────

    public static final String SYSTEM_QUIZ_GENERATOR = """
            You are an expert educational content creator specialised in creating high-quality quiz questions.
            You always respond with valid JSON only. No markdown, no explanation outside the JSON.
            Generate accurate, unambiguous questions with exactly one correct answer.
            """;

    public static final String SYSTEM_EXPLAINER = """
            You are a patient, expert tutor who explains concepts clearly and concisely.
            You always respond with valid JSON only. No markdown, no explanation outside the JSON.
            """;

    public static final String SYSTEM_INTERVIEW = """
            You are an experienced technical interviewer at a top-tier tech company.
            You ask probing, relevant questions and give honest, constructive feedback.
            You always respond with valid JSON only. No markdown, no explanation outside the JSON.
            """;

    public static final String SYSTEM_ANALYST = """
            You are a learning analytics expert who identifies skill gaps and creates personalised learning plans.
            You always respond with valid JSON only. No markdown, no explanation outside the JSON.
            """;

    // ─── User prompt templates ────────────────────────────────────────────────

    /**
     * Quiz generation prompt.
     * Placeholders: {TOPIC}, {CATEGORY}, {DIFFICULTY}, {QUESTION_COUNT}, {LANGUAGE}
     */
    public String quizGenerationPrompt(String topic, String category, String difficulty,
                                        int questionCount, String language) {
        return """
                Generate a quiz about: %s
                Category: %s
                Difficulty: %s
                Number of questions: %d
                Language: %s
                
                Return a JSON object matching this exact schema:
                {
                  "title": "string (max 150 chars)",
                  "description": "string (2-3 sentences)",
                  "estimatedDurationMinutes": number,
                  "questions": [
                    {
                      "text": "string (the question)",
                      "options": ["string", "string", "string", "string"],
                      "correctOptionIndex": 0,
                      "explanation": "string (why this answer is correct)",
                      "difficulty": "EASY|MEDIUM|HARD",
                      "tags": ["string"]
                    }
                  ]
                }
                
                Rules:
                - Each question must have exactly 4 options
                - correctOptionIndex is 0-based (0=first option)
                - explanation must be 1-2 sentences
                - All questions must be factually accurate
                - Vary difficulty across questions if difficulty is MIXED
                """.formatted(topic, category, difficulty, questionCount, language);
    }

    /**
     * Answer explanation prompt.
     * Placeholders: {QUESTION}, {CORRECT_ANSWER}, {USER_ANSWER}, {CONTEXT}
     */
    public String answerExplanationPrompt(String question, String correctAnswer,
                                           String userAnswer, String context) {
        return """
                Question: %s
                Correct answer: %s
                User's answer: %s
                Quiz context: %s
                
                Return a JSON object:
                {
                  "explanation": "string (clear explanation of why the correct answer is right)",
                  "whyUserWasWrong": "string (if user was wrong, explain the misconception) or null",
                  "conceptSummary": "string (brief summary of the underlying concept)",
                  "keyPoints": ["string"],
                  "analogy": "string (helpful analogy if applicable) or null",
                  "furtherReading": ["string (topic to research)"]
                }
                """.formatted(question, correctAnswer, userAnswer, context);
    }

    /**
     * Skill gap analysis prompt.
     */
    public String skillGapAnalysisPrompt(String analyticsJson) {
        return """
                Analyse this user's quiz performance data and identify skill gaps:
                
                %s
                
                Return a JSON object:
                {
                  "overallLevel": "BEGINNER|INTERMEDIATE|ADVANCED|EXPERT",
                  "strengths": ["string (category/topic names)"],
                  "gaps": [
                    {
                      "category": "string",
                      "currentLevel": number (0-100),
                      "targetLevel": number (0-100),
                      "priority": "HIGH|MEDIUM|LOW",
                      "recommendedFocusAreas": ["string"]
                    }
                  ],
                  "summary": "string (2-3 sentence personalised summary)",
                  "recommendedNextStep": "string"
                }
                """.formatted(analyticsJson);
    }

    /**
     * Learning path generation prompt.
     */
    public String learningPathPrompt(String skillGapsJson, String targetSkill,
                                      String currentLevel, int weeksDuration) {
        return """
                Create a personalised learning path.
                Skill gaps identified: %s
                Target skill: %s
                Current level: %s
                Duration: %d weeks
                
                Return a JSON object:
                {
                  "title": "string",
                  "description": "string",
                  "estimatedHours": number,
                  "difficulty": "BEGINNER|INTERMEDIATE|ADVANCED|MIXED",
                  "milestones": [
                    {
                      "milestoneIndex": number (1-based),
                      "title": "string",
                      "description": "string",
                      "topics": ["string"],
                      "estimatedHours": number,
                      "quizTopics": ["string (topics for quiz practice)"]
                    }
                  ]
                }
                """.formatted(skillGapsJson, targetSkill, currentLevel, weeksDuration);
    }

    /**
     * Interview question generation prompt.
     */
    public String interviewQuestionPrompt(String topic, String roleTitle,
                                           String experienceLevel, String previousQuestionsJson) {
        return """
                Generate an interview question.
                Topic: %s
                Role: %s
                Experience level: %s
                Previous questions (avoid repetition): %s
                
                Return a JSON object:
                {
                  "question": "string",
                  "questionType": "TECHNICAL|BEHAVIORAL|SYSTEM_DESIGN|CODING",
                  "followUpHints": ["string (for the interviewer)"],
                  "expectedKeyPoints": ["string (what a good answer should cover)"],
                  "difficulty": "EASY|MEDIUM|HARD",
                  "estimatedMinutes": number
                }
                """.formatted(topic, roleTitle, experienceLevel, previousQuestionsJson);
    }

    /**
     * Interview answer evaluation prompt.
     */
    public String interviewEvaluationPrompt(String question, String userAnswer,
                                             String expectedKeyPoints) {
        return """
                Evaluate this interview answer.
                Question: %s
                Candidate's answer: %s
                Expected key points: %s
                
                Return a JSON object:
                {
                  "score": number (0-100),
                  "technicalAccuracy": number (0-100),
                  "communication": number (0-100),
                  "completeness": number (0-100),
                  "feedback": "string (2-3 sentences of constructive feedback)",
                  "strengths": ["string"],
                  "missedPoints": ["string (key points not mentioned)"],
                  "suggestedImprovement": "string"
                }
                """.formatted(question, userAnswer, expectedKeyPoints);
    }

    /**
     * Final interview session feedback prompt.
     */
    public String interviewFeedbackPrompt(String conversationJson, String roleTitle) {
        return """
                Provide final feedback for this mock interview session.
                Role: %s
                Full conversation: %s
                
                Return a JSON object:
                {
                  "overallScore": number (0-100),
                  "technicalScore": number (0-100),
                  "communicationScore": number (0-100),
                  "problemSolvingScore": number (0-100),
                  "summary": "string (3-4 sentences)",
                  "strengths": ["string"],
                  "improvements": ["string"],
                  "readinessLevel": "NOT_READY|NEEDS_WORK|ALMOST_READY|READY",
                  "nextSteps": ["string (specific actions to improve)"]
                }
                """.formatted(roleTitle, conversationJson);
    }

    /**
     * Quiz recommendation prompt.
     */
    public String recommendationPrompt(String analyticsJson, String availableQuizzesJson) {
        return """
                Recommend quizzes for this user.
                User analytics: %s
                Available quizzes: %s
                
                Return a JSON object:
                {
                  "rationale": "string (why these are recommended)",
                  "items": [
                    {
                      "rank": number (1-based),
                      "entityId": "string (quiz UUID)",
                      "entityType": "QUIZ",
                      "title": "string",
                      "reason": "string (specific reason for this user)",
                      "confidenceScore": number (0.0-1.0)
                    }
                  ]
                }
                """.formatted(analyticsJson, availableQuizzesJson);
    }
}
