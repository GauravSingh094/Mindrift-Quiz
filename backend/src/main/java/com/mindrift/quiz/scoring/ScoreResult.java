package com.mindrift.quiz.scoring;

import lombok.Builder;
import lombok.Getter;

/**
 * Immutable result of scoring a single question answer.
 * Carries enough information for both score aggregation and audit.
 */
@Getter
@Builder
public class ScoreResult {

    /** Points earned (may be negative if negative marking applied) */
    private final double pointsEarned;

    /** Maximum points possible for this question */
    private final double maxPoints;

    /** True if user got 100% of available marks */
    private final boolean correct;

    /** True if user got >0 but <100% (MULTI_SELECT partial credit) */
    private final boolean partial;

    /** Human-readable classification: CORRECT | INCORRECT | PARTIAL | NEGATIVE | UNANSWERED */
    private final String scoreType;

    public static ScoreResult unanswered(double maxPoints) {
        return ScoreResult.builder()
                .pointsEarned(0.0)
                .maxPoints(maxPoints)
                .correct(false)
                .partial(false)
                .scoreType("UNANSWERED")
                .build();
    }

    public static ScoreResult correct(double points) {
        return ScoreResult.builder()
                .pointsEarned(points)
                .maxPoints(points)
                .correct(true)
                .partial(false)
                .scoreType("CORRECT")
                .build();
    }

    public static ScoreResult incorrect(double penaltyPoints) {
        return ScoreResult.builder()
                .pointsEarned(penaltyPoints)       // will be ≤ 0
                .maxPoints(0.0)
                .correct(false)
                .partial(false)
                .scoreType(penaltyPoints < 0 ? "NEGATIVE" : "INCORRECT")
                .build();
    }

    public static ScoreResult partial(double earned, double max) {
        return ScoreResult.builder()
                .pointsEarned(earned)
                .maxPoints(max)
                .correct(false)
                .partial(true)
                .scoreType("PARTIAL")
                .build();
    }
}
