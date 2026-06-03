package com.mindrift.ai.entity;

/**
 * All AI operation types — used to route to the correct prompt template
 * and for usage tracking / billing.
 */
public enum AIRequestType {

    // ─── Quiz generation ─────────────────────────────────────────────────────
    QUIZ_GENERATION,         // Generate a complete quiz from a topic
    QUESTION_GENERATION,     // Generate individual questions for an existing quiz

    // ─── Explanations ────────────────────────────────────────────────────────
    ANSWER_EXPLANATION,      // Explain why an answer is correct/incorrect
    CONCEPT_EXPLANATION,     // Explain a concept in the context of a quiz

    // ─── Skill & learning ────────────────────────────────────────────────────
    SKILL_GAP_ANALYSIS,      // Analyse user analytics and identify weak areas
    LEARNING_PATH_GENERATION, // Generate a structured learning path

    // ─── Interview simulator ──────────────────────────────────────────────────
    INTERVIEW_QUESTION,       // Generate an interview question
    INTERVIEW_EVALUATION,     // Evaluate a user's answer in interview context
    INTERVIEW_FEEDBACK,       // Final interview session feedback

    // ─── Recommendations ─────────────────────────────────────────────────────
    QUIZ_RECOMMENDATION,      // Recommend quizzes based on user profile
    CONTENT_RECOMMENDATION,   // Recommend learning content

    // ─── Admin/Internal ──────────────────────────────────────────────────────
    CONTENT_MODERATION,       // Flag inappropriate quiz/question content
    DIFFICULTY_CALIBRATION    // Calibrate question difficulty from analytics
}
