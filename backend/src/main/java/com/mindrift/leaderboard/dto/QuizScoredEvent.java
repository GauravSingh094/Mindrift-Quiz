package com.mindrift.leaderboard.dto;

import lombok.Builder;
import lombok.Value;

import java.util.List;
import java.util.UUID;

/**
 * Payload published to Kafka (topic: quiz-scored) after a quiz attempt is scored.
 * The leaderboard consumer listens to this event to update rankings.
 */
@Value
@Builder
public class QuizScoredEvent {

    UUID userId;
    UUID quizId;
    UUID categoryId;
    double score;
    double maxScore;
    double percentage;
    boolean passed;
    boolean perfectScore;
    long timeTakenSeconds;
    long attemptNumber;
}
