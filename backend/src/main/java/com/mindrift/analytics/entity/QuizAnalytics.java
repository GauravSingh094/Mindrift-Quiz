package com.mindrift.analytics.entity;

import com.mindrift.common.base.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Aggregated analytics for a single quiz.
 *
 * Keyed by quiz_id. Updated after every finalised attempt for that quiz.
 * Provides quiz authors and admins with live performance metrics.
 */
@Getter
@Setter
@Entity
@Table(
    name = "quiz_analytics",
    indexes = {
        @Index(name = "idx_qa_quiz",         columnList = "quiz_id"),
        @Index(name = "idx_qa_avg_score",    columnList = "average_score DESC"),
        @Index(name = "idx_qa_attempts",     columnList = "total_attempts DESC")
    }
)
public class QuizAnalytics extends BaseEntity {

    @Column(name = "quiz_id", nullable = false, unique = true)
    private UUID quizId;

    @Column(name = "quiz_title", length = 150)
    private String quizTitle;

    @Column(name = "category_id")
    private UUID categoryId;

    @Column(name = "category_name", length = 100)
    private String categoryName;

    // ─── Attempt volume ─────────────────────────────────────────────────────
    @Column(name = "total_attempts", nullable = false)
    private Long totalAttempts = 0L;

    @Column(name = "unique_players", nullable = false)
    private Long uniquePlayers = 0L;

    @Column(name = "submitted_attempts", nullable = false)
    private Long submittedAttempts = 0L;

    @Column(name = "expired_attempts", nullable = false)
    private Long expiredAttempts = 0L;

    // ─── Score distribution ─────────────────────────────────────────────────
    @Column(name = "average_score", nullable = false)
    private Double averageScore = 0.0;

    @Column(name = "average_percentage", nullable = false)
    private Double averagePercentage = 0.0;

    @Column(name = "highest_score", nullable = false)
    private Double highestScore = 0.0;

    @Column(name = "lowest_score", nullable = false)
    private Double lowestScore = 0.0;

    @Column(name = "pass_count", nullable = false)
    private Long passCount = 0L;

    @Column(name = "pass_rate", nullable = false)
    private Double passRate = 0.0;

    @Column(name = "perfect_score_count", nullable = false)
    private Long perfectScoreCount = 0L;

    // ─── Question-level stats (JSON) ────────────────────────────────────────
    /** JSON: {"<questionId>": {"correct": 120, "total": 200, "accuracy": 0.60}} */
    @Column(name = "question_accuracy_map", columnDefinition = "JSONB")
    private String questionAccuracyMap = "{}";

    /** ID of the most-missed question */
    @Column(name = "hardest_question_id")
    private UUID hardestQuestionId;

    /** ID of the most-answered-correctly question */
    @Column(name = "easiest_question_id")
    private UUID easiestQuestionId;

    // ─── Timing ─────────────────────────────────────────────────────────────
    @Column(name = "average_time_seconds", nullable = false)
    private Long averageTimeSeconds = 0L;

    @Column(name = "fastest_completion_seconds")
    private Long fastestCompletionSeconds;

    // ─── Engagement ─────────────────────────────────────────────────────────
    @Column(name = "repeat_attempt_rate", nullable = false)
    private Double repeatAttemptRate = 0.0;

    @Column(name = "last_attempted_at")
    private Instant lastAttemptedAt;
}
