package com.mindrift.analytics.entity;

import com.mindrift.common.base.BaseEntity;
import com.mindrift.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

/**
 * Per-user skill analytics per category/topic.
 *
 * Tracks mastery level and trend for each category the user has attempted.
 * Used to surface personalised study recommendations.
 */
@Getter
@Setter
@Entity
@Table(
    name = "skill_analytics",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_skill_user_category",
        columnNames = {"user_id", "category_id"}
    ),
    indexes = {
        @Index(name = "idx_skill_user",        columnList = "user_id"),
        @Index(name = "idx_skill_category",    columnList = "category_id"),
        @Index(name = "idx_skill_mastery",     columnList = "mastery_score DESC")
    }
)
public class SkillAnalytics extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "category_id", nullable = false)
    private UUID categoryId;

    @Column(name = "category_name", length = 100)
    private String categoryName;

    // ─── Skill metrics ─────────────────────────────────────────────────────
    /** Weighted mastery score 0–100 */
    @Column(name = "mastery_score", nullable = false)
    private Double masteryScore = 0.0;

    /** BEGINNER | INTERMEDIATE | ADVANCED | EXPERT */
    @Column(name = "skill_level", length = 30)
    private String skillLevel = "BEGINNER";

    @Column(name = "attempts_in_category", nullable = false)
    private Long attemptsInCategory = 0L;

    @Column(name = "average_score_in_category", nullable = false)
    private Double averageScoreInCategory = 0.0;

    @Column(name = "correct_answers_in_category", nullable = false)
    private Long correctAnswersInCategory = 0L;

    @Column(name = "total_answers_in_category", nullable = false)
    private Long totalAnswersInCategory = 0L;

    @Column(name = "accuracy_in_category", nullable = false)
    private Double accuracyInCategory = 0.0;

    /** Trend: IMPROVING | STABLE | DECLINING */
    @Column(name = "trend", length = 20)
    private String trend = "STABLE";

    /** Running delta of last 5 attempt scores vs previous 5 */
    @Column(name = "trend_delta", nullable = false)
    private Double trendDelta = 0.0;

    /** JSON of last 10 scores for sparkline rendering: [72.0, 80.0, 75.0, …] */
    @Column(name = "score_history", columnDefinition = "JSONB")
    private String scoreHistory = "[]";
}
