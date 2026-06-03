package com.mindrift.analytics.dto;

import lombok.Builder;
import lombok.Value;

import java.time.Instant;
import java.util.UUID;

/**
 * Internal Kafka event consumed from the quiz-events topic (ATTEMPT_FINALISED).
 * Mirrors AttemptFinalisedEvent structure for decoupled deserialization.
 */
@Value
@Builder
public class AttemptFinalisedAnalyticsEvent {

    String eventType;       // ATTEMPT_SUBMITTED | ATTEMPT_EXPIRED
    UUID attemptId;
    UUID userId;
    UUID quizId;
    UUID categoryId;        // Resolved by analytics consumer from Quiz record
    double score;
    double maxScore;
    double percentage;
    boolean passed;
    int correctCount;
    int incorrectCount;
    int unansweredCount;
    long timeTakenSeconds;
    Integer attemptNumber;
    String difficulty;      // Quiz difficulty at time of attempt
    Instant occurredAt;
}
