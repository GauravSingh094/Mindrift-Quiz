package com.mindrift.quiz.event;

import lombok.Builder;
import lombok.Getter;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Kafka event emitted when a user submits an answer during a quiz attempt.
 * Topic: quiz-events
 */
@Getter
@Builder
public class AnswerSubmittedEvent {
    private final String eventType = "ANSWER_SUBMITTED";
    private final UUID attemptId;
    private final UUID userId;
    private final UUID quizId;
    private final UUID questionId;
    private final List<String> selectedOptionIds;
    private final double pointsEarned;
    private final double maxPoints;
    private final String scoreType;
    private final Instant occurredAt;
}
