package com.mindrift.quiz.dto;

import com.mindrift.quiz.entity.QuizAttemptStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Full response returned when starting a quiz attempt.
 * Contains everything the client needs to render the quiz UI.
 */
@Getter
@Builder
public class StartAttemptResponse {
    private UUID attemptId;
    private UUID quizId;
    private String quizTitle;
    private Instant startTime;
    private Instant endTime;
    private long remainingSeconds;
    private int totalQuestions;
    private int estimatedDurationMinutes;
    private QuizAttemptStatus status;
    private List<QuestionResponse> questions;
}
