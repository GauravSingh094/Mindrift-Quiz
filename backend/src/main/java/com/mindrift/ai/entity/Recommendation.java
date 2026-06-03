package com.mindrift.ai.entity;

import com.mindrift.common.base.BaseEntity;
import com.mindrift.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Personalised quiz / content recommendation.
 *
 * Generated either on-demand (GET /ai/recommendations) or
 * asynchronously after analytics updates.
 */
@Getter
@Setter
@Entity
@Table(
    name = "ai_recommendations",
    indexes = {
        @Index(name = "idx_rec_user",    columnList = "user_id"),
        @Index(name = "idx_rec_type",    columnList = "recommendation_type"),
        @Index(name = "idx_rec_active",  columnList = "user_id, expires_at"),
        @Index(name = "idx_rec_request", columnList = "ai_request_id")
    }
)
public class Recommendation extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ai_request_id")
    private AIRequest aiRequest;

    // ─── Classification ───────────────────────────────────────────────────
    /** QUIZ | CATEGORY | LEARNING_PATH | TOPIC */
    @Column(name = "recommendation_type", nullable = false, length = 30)
    private String recommendationType;

    // ─── Recommended items ────────────────────────────────────────────────
    /**
     * Ordered list of recommended items as JSON:
     * [{ rank, entityId, entityType, title, reason, confidenceScore }]
     */
    @Column(name = "items_json", columnDefinition = "JSONB", nullable = false)
    private String itemsJson = "[]";

    @Column(name = "item_count")
    private Integer itemCount = 0;

    // ─── Rationale ────────────────────────────────────────────────────────
    @Column(name = "rationale", columnDefinition = "TEXT")
    private String rationale;

    /** Analytics snapshot used to generate (JSON) — for traceability */
    @Column(name = "analytics_snapshot_json", columnDefinition = "JSONB")
    private String analyticsSnapshotJson;

    // ─── Lifecycle ────────────────────────────────────────────────────────
    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "was_acted_on")
    private Boolean wasActedOn = false;

    @Column(name = "acted_on_at")
    private Instant actedOnAt;

    /** Which of the recommended item IDs the user clicked/started */
    @Column(name = "acted_entity_id")
    private UUID actedEntityId;
}
