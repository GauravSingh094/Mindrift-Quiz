package com.mindrift.leaderboard.entity;

import com.mindrift.common.base.BaseEntity;
import com.mindrift.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/**
 * Tracks which achievements a user has unlocked and when.
 * The unique constraint on (user_id, achievement_type) guarantees
 * each badge is awarded exactly once.
 */
@Getter
@Setter
@Entity
@Table(
    name = "user_achievements",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_user_achievement",
        columnNames = {"user_id", "achievement_type"}
    ),
    indexes = {
        @Index(name = "idx_achievements_user",  columnList = "user_id"),
        @Index(name = "idx_achievements_type",  columnList = "achievement_type"),
        @Index(name = "idx_achievements_earned", columnList = "earned_at DESC")
    }
)
public class UserAchievement extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "achievement_type", nullable = false, length = 60)
    private AchievementType achievementType;

    @Column(name = "earned_at", nullable = false)
    private Instant earnedAt;

    /**
     * Optional contextual data (e.g., competition ID that triggered a "First Win").
     * Stored as a serialised string for simplicity.
     */
    @Column(name = "context", length = 500)
    private String context;
}
