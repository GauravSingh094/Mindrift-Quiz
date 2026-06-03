package com.mindrift.ai.entity;

import com.mindrift.common.base.BaseEntity;
import com.mindrift.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/**
 * AI-generated personalised learning path for a user.
 *
 * A learning path is a structured sequence of learning milestones
 * targeting identified skill gaps. Each milestone includes a topic,
 * recommended quizzes, and estimated hours.
 */
@Getter
@Setter
@Entity
@Table(
    name = "learning_paths",
    indexes = {
        @Index(name = "idx_lp_user",      columnList = "user_id"),
        @Index(name = "idx_lp_status",    columnList = "status"),
        @Index(name = "idx_lp_request",   columnList = "ai_request_id")
    }
)
public class LearningPath extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ai_request_id")
    private AIRequest aiRequest;

    // ─── Metadata ─────────────────────────────────────────────────────────
    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "target_skill", length = 100)
    private String targetSkill;

    @Column(name = "estimated_hours")
    private Integer estimatedHours;

    @Column(name = "difficulty", length = 20)
    private String difficulty; // BEGINNER | INTERMEDIATE | ADVANCED | MIXED

    // ─── Path content ─────────────────────────────────────────────────────
    /**
     * Ordered list of milestones as JSON:
     * [{ milestoneIndex, title, description, topics: [], quizIds: [], estimatedHours }]
     */
    @Column(name = "milestones_json", columnDefinition = "JSONB", nullable = false)
    private String milestonesJson = "[]";

    /** Identified skill gaps that prompted this path (JSON array of category names) */
    @Column(name = "skill_gaps_json", columnDefinition = "JSONB")
    private String skillGapsJson = "[]";

    // ─── Status ───────────────────────────────────────────────────────────
    /** ACTIVE | COMPLETED | PAUSED | ARCHIVED */
    @Column(name = "status", nullable = false, length = 20)
    private String status = "ACTIVE";

    @Column(name = "total_milestones")
    private Integer totalMilestones = 0;

    @Column(name = "completed_milestones")
    private Integer completedMilestones = 0;

    @Column(name = "progress_percentage")
    private Double progressPercentage = 0.0;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "target_completion_date")
    private Instant targetCompletionDate;
}
