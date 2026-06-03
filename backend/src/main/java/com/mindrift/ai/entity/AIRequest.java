package com.mindrift.ai.entity;

import com.mindrift.common.base.BaseEntity;
import com.mindrift.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/**
 * Audit record for every AI API call made.
 *
 * Stores the full prompt, provider used, token counts, latency, and status.
 * Used for:
 *   - Usage billing and quota enforcement
 *   - Provider performance comparison
 *   - Prompt replay / debugging
 *   - Admin analytics
 */
@Getter
@Setter
@Entity
@Table(
    name = "ai_requests",
    indexes = {
        @Index(name = "idx_aireq_user",      columnList = "user_id"),
        @Index(name = "idx_aireq_type",      columnList = "request_type"),
        @Index(name = "idx_aireq_provider",  columnList = "provider"),
        @Index(name = "idx_aireq_status",    columnList = "status"),
        @Index(name = "idx_aireq_created",   columnList = "created_at DESC")
    }
)
public class AIRequest extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    // ─── Classification ───────────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(name = "request_type", nullable = false, length = 50)
    private AIRequestType requestType;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false, length = 20)
    private AIProvider provider;

    /** Logical name of the prompt template used (e.g. "quiz-generation-v2") */
    @Column(name = "prompt_template", length = 80)
    private String promptTemplate;

    // ─── Prompt ───────────────────────────────────────────────────────────
    @Column(name = "system_prompt", columnDefinition = "TEXT")
    private String systemPrompt;

    @Column(name = "user_prompt", columnDefinition = "TEXT", nullable = false)
    private String userPrompt;

    /** Key/value context injected into prompt (JSON) */
    @Column(name = "prompt_context", columnDefinition = "JSONB")
    private String promptContext;

    // ─── Provider params ──────────────────────────────────────────────────
    @Column(name = "model_id", length = 80)
    private String modelId;

    @Column(name = "temperature")
    private Double temperature = 0.7;

    @Column(name = "max_tokens")
    private Integer maxTokens = 4096;

    // ─── Status ───────────────────────────────────────────────────────────
    /** PENDING | PROCESSING | COMPLETED | FAILED | CACHED */
    @Column(name = "status", nullable = false, length = 20)
    private String status = "PENDING";

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    /** How many provider fallback attempts were made */
    @Column(name = "retry_count")
    private Integer retryCount = 0;

    // ─── Token usage ─────────────────────────────────────────────────────
    @Column(name = "prompt_tokens")
    private Integer promptTokens;

    @Column(name = "completion_tokens")
    private Integer completionTokens;

    @Column(name = "total_tokens")
    private Integer totalTokens;

    // ─── Timing ───────────────────────────────────────────────────────────
    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    /** Latency in milliseconds */
    @Column(name = "latency_ms")
    private Long latencyMs;

    // ─── Cache ────────────────────────────────────────────────────────────
    /** SHA-256 hash of the prompt for cache lookup */
    @Column(name = "prompt_hash", length = 64)
    private String promptHash;

    @Column(name = "cache_hit")
    private Boolean cacheHit = false;

    // ─── Async job reference ──────────────────────────────────────────────
    @Column(name = "job_id", length = 50)
    private String jobId;
}
