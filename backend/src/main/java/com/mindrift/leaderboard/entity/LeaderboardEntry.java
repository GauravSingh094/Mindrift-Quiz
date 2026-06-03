package com.mindrift.leaderboard.entity;

import com.mindrift.common.base.BaseEntity;
import com.mindrift.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/**
 * Persistent global leaderboard record per user.
 * Redis ZSET is the real-time read source; this table is the source of truth
 * that Redis is hydrated from on startup and after each scored attempt.
 */
@Getter
@Setter
@Entity
@Table(
    name = "leaderboard_entries",
    indexes = {
        @Index(name = "idx_lb_user",        columnList = "user_id"),
        @Index(name = "idx_lb_total_score", columnList = "total_score DESC"),
        @Index(name = "idx_lb_season",      columnList = "season_id"),
        @Index(name = "idx_lb_category",    columnList = "category_id")
    }
)
public class LeaderboardEntry extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** NULL → global leaderboard; non-null → category leaderboard */
    @Column(name = "category_id")
    private java.util.UUID categoryId;

    /** NULL → all-time; non-null → seasonal */
    @Column(name = "season_id")
    private java.util.UUID seasonId;

    @Column(name = "total_score", nullable = false)
    private Double totalScore = 0.0;

    @Column(name = "total_attempts", nullable = false)
    private Long totalAttempts = 0L;

    @Column(name = "perfect_scores", nullable = false)
    private Long perfectScores = 0L;

    @Column(name = "wins", nullable = false)
    private Long wins = 0L;

    @Column(name = "top10_count", nullable = false)
    private Long top10Count = 0L;

    @Column(name = "average_score", nullable = false)
    private Double averageScore = 0.0;

    @Column(name = "current_rank")
    private Integer currentRank;

    @Column(name = "best_rank")
    private Integer bestRank;

    @Column(name = "last_active")
    private Instant lastActive;

    @Column(name = "streak_days", nullable = false)
    private Integer streakDays = 0;
}
