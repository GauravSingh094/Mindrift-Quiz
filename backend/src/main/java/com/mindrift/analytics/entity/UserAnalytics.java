package com.mindrift.analytics.entity;

import com.mindrift.common.base.BaseEntity;
import com.mindrift.quiz.entity.QuizDifficulty;
import com.mindrift.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/**
 * Aggregated analytics profile for a single user.
 *
 * Updated incrementally via Kafka consumer on every ATTEMPT_FINALISED event.
 * Queried directly for GET /analytics/me — no heavy join needed.
 */
@Getter
@Setter
@Entity
@Table(
    name = "user_analytics",
    indexes = {
        @Index(name = "idx_ua_user",         columnList = "user_id"),
        @Index(name = "idx_ua_total_score",  columnList = "total_score DESC"),
        @Index(name = "idx_ua_last_active",  columnList = "last_active_at DESC")
    }
)
public class UserAnalytics extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    // ─── Attempt counts ────────────────────────────────────────────────────
    @Column(name = "total_attempts", nullable = false)
    private Long totalAttempts = 0L;

    @Column(name = "submitted_attempts", nullable = false)
    private Long submittedAttempts = 0L;

    @Column(name = "passed_attempts", nullable = false)
    private Long passedAttempts = 0L;

    @Column(name = "perfect_score_count", nullable = false)
    private Long perfectScoreCount = 0L;

    // ─── Score aggregates ─────────────────────────────────────────────────
    @Column(name = "total_score", nullable = false)
    private Double totalScore = 0.0;

    @Column(name = "average_score", nullable = false)
    private Double averageScore = 0.0;

    @Column(name = "best_score", nullable = false)
    private Double bestScore = 0.0;

    @Column(name = "average_percentage", nullable = false)
    private Double averagePercentage = 0.0;

    // ─── Question stats ────────────────────────────────────────────────────
    @Column(name = "total_questions_answered", nullable = false)
    private Long totalQuestionsAnswered = 0L;

    @Column(name = "total_correct", nullable = false)
    private Long totalCorrect = 0L;

    @Column(name = "total_incorrect", nullable = false)
    private Long totalIncorrect = 0L;

    @Column(name = "total_unanswered", nullable = false)
    private Long totalUnanswered = 0L;

    @Column(name = "accuracy_rate", nullable = false)
    private Double accuracyRate = 0.0;

    // ─── Time stats ────────────────────────────────────────────────────────
    @Column(name = "total_time_spent_seconds", nullable = false)
    private Long totalTimeSpentSeconds = 0L;

    @Column(name = "average_time_per_attempt_seconds", nullable = false)
    private Long averageTimePerAttemptSeconds = 0L;

    // ─── Difficulty breakdown (JSON) ───────────────────────────────────────
    /** JSON: {"EASY": 10, "MEDIUM": 25, "HARD": 5} */
    @Column(name = "difficulty_breakdown", columnDefinition = "JSONB")
    private String difficultyBreakdown = "{}";

    /** JSON: {"EASY": 85.5, "MEDIUM": 72.0, "HARD": 60.1} */
    @Column(name = "difficulty_avg_score", columnDefinition = "JSONB")
    private String difficultyAvgScore = "{}";

    // ─── Streak ────────────────────────────────────────────────────────────
    @Column(name = "current_streak_days", nullable = false)
    private Integer currentStreakDays = 0;

    @Column(name = "longest_streak_days", nullable = false)
    private Integer longestStreakDays = 0;

    @Column(name = "last_active_at")
    private Instant lastActiveAt;

    // ─── Category favourite ────────────────────────────────────────────────
    @Column(name = "favourite_category_id")
    private java.util.UUID favouriteCategoryId;

    @Column(name = "favourite_category_name", length = 100)
    private String favouriteCategoryName;

    // ─── Win rate (competitions) ────────────────────────────────────────────
    @Column(name = "competition_participations", nullable = false)
    private Long competitionParticipations = 0L;

    @Column(name = "competition_wins", nullable = false)
    private Long competitionWins = 0L;
}
