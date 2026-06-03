package com.mindrift.quiz.dto;

import com.mindrift.quiz.entity.QuizAttemptStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Returns current in-progress attempt state (for reconnect/resume scenarios).
 */
@Getter
@Builder
public class AttemptProgressResponse {
    private UUID attemptId;
    private UUID quizId;
    private String quizTitle;
    private QuizAttemptStatus status;
    private Instant startTime;
    private Instant endTime;
    private long remainingSeconds;
    private int totalQuestions;
    private int answeredCount;
    private double runningScore;
    /** questionId → list of selectedOptionIds (for UI state restore) */
    private Map<String, java.util.List<String>> answeredQuestions;
}
