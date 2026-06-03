package com.mindrift.quiz.session;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Redis-cached session state for an active quiz attempt.
 * Stored as JSON at key: mindrift:attempts:session:{attemptId}
 * TTL = estimatedDuration * 60 + 300 seconds (5min grace)
 *
 * This eliminates DB reads for in-progress saves, reducing DB load significantly.
 * On final submission, the canonical state is persisted back to Postgres.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttemptSession implements Serializable {

    private UUID attemptId;
    private UUID userId;
    private UUID quizId;
    private String status;              // STARTED | IN_PROGRESS
    private Instant startTime;
    private Instant endTime;
    private Integer attemptNumber;

    /** Running score cached in Redis — authoritative value written to DB on submission */
    private double runningScore;

    /** questionId → latest saved answer */
    @Builder.Default
    private Map<String, List<String>> answeredQuestions = new HashMap<>();

    /** Total questions in quiz (for progress calculation) */
    private int totalQuestions;

    /** Last activity timestamp — used for inactivity detection */
    private Instant lastActivityAt;

    /** Negative marking fraction (cached from quiz config) */
    private double negativeMarkingFraction;

    public int getAnsweredCount() {
        return answeredQuestions.size();
    }

    public boolean isExpired() {
        return Instant.now().isAfter(endTime);
    }

    public boolean hasAnswered(UUID questionId) {
        return answeredQuestions.containsKey(questionId.toString());
    }

    public long getRemainingSeconds() {
        long remaining = endTime.getEpochSecond() - Instant.now().getEpochSecond();
        return Math.max(0L, remaining);
    }
}
