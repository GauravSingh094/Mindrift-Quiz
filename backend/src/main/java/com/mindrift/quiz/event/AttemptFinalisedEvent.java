package com.mindrift.quiz.event;

import lombok.Builder;
import lombok.Getter;
import java.time.Instant;
import java.util.UUID;

/**
 * Kafka event emitted when an attempt is finalized (SUBMITTED or EXPIRED).
 * Topic: quiz-events
 * Consumed by: leaderboard-service, analytics-service, notification-service
 */
@Getter
@Builder
public class AttemptFinalisedEvent {
    private final String eventType;   // ATTEMPT_SUBMITTED | ATTEMPT_EXPIRED
    private final UUID attemptId;
    private final UUID userId;
    private final UUID quizId;
    private final double score;
    private final double maxScore;
    private final double percentage;
    private final boolean passed;
    private final int correctCount;
    private final int incorrectCount;
    private final int unansweredCount;
    private final long timeTakenSeconds;
    private final Integer attemptNumber;
    private final Instant occurredAt;
}
