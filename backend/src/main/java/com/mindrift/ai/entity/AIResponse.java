package com.mindrift.ai.entity;

import com.mindrift.common.base.BaseEntity;
import com.mindrift.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

/**
 * Stores the raw AI response text plus parsed structured output.
 *
 * One-to-one with AIRequest. Kept separate for blob storage efficiency
 * (large response bodies don't bloat the request audit table).
 */
@Getter
@Setter
@Entity
@Table(
    name = "ai_responses",
    indexes = {
        @Index(name = "idx_aires_request", columnList = "request_id", unique = true),
        @Index(name = "idx_aires_user",    columnList = "user_id")
    }
)
public class AIResponse extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false, unique = true)
    private AIRequest request;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    // ─── Raw output ───────────────────────────────────────────────────────
    @Column(name = "raw_response", columnDefinition = "TEXT")
    private String rawResponse;

    /** Parsed structured JSON (may differ from rawResponse if parsing/cleanup was applied) */
    @Column(name = "parsed_json", columnDefinition = "JSONB")
    private String parsedJson;

    // ─── Quality signals ──────────────────────────────────────────────────
    /** 0.0–1.0 confidence / quality score from provider (where available) */
    @Column(name = "quality_score")
    private Double qualityScore;

    /** Whether the response was flagged by content-safety filters */
    @Column(name = "content_flagged")
    private Boolean contentFlagged = false;

    @Column(name = "flag_reason", columnDefinition = "TEXT")
    private String flagReason;

    // ─── User feedback ────────────────────────────────────────────────────
    /** 1–5 user rating (null = not rated) */
    @Column(name = "user_rating")
    private Integer userRating;

    @Column(name = "user_feedback", columnDefinition = "TEXT")
    private String userFeedback;

    // ─── Reference to generated artifact ─────────────────────────────────
    /** If a quiz/question was persisted from this response, its ID is stored here */
    @Column(name = "generated_entity_id")
    private UUID generatedEntityId;

    @Column(name = "generated_entity_type", length = 50)
    private String generatedEntityType; // QUIZ | QUESTION | LEARNING_PATH | RECOMMENDATION
}
