package com.mindrift.quiz.event;

import lombok.Builder;
import lombok.Getter;
import java.time.Instant;
import java.util.UUID;

/**
 * Kafka event emitted when a user starts a quiz attempt.
 * Topic: quiz-events
 */
@Getter
@Builder
public class AttemptStartedEvent {
    private final String eventType = "ATTEMPT_STARTED";
    private final UUID attemptId;
    private final UUID userId;
    private final UUID quizId;
    private final Integer attemptNumber;
    private final Instant startTime;
    private final Instant endTime;
    private final Instant occurredAt;
}
