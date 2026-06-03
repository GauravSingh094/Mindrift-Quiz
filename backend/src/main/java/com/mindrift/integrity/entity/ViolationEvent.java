package com.mindrift.integrity.entity;

import com.mindrift.common.base.BaseEntity;
import com.mindrift.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Stores a single integrity violation event.
 *
 * Written on every POST /violations call from the browser SDK.
 * Also written programmatically by server-side integrity checks.
 *
 * One violation = one observable behaviour anomaly at a precise moment.
 * Multiple violations per attempt are aggregated into a RiskScore.
 */
@Getter
@Setter
@Entity
@Table(
    name = "violation_events",
    indexes = {
        @Index(name = "idx_viol_attempt",    columnList = "attempt_id"),
        @Index(name = "idx_viol_user",       columnList = "user_id"),
        @Index(name = "idx_viol_type",       columnList = "violation_type"),
        @Index(name = "idx_viol_occurred",   columnList = "occurred_at DESC"),
        @Index(name = "idx_viol_risk",       columnList = "risk_level")
    }
)
public class ViolationEvent extends BaseEntity {

    // ─── Context ───────────────────────────────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** The attempt this violation occurred during */
    @Column(name = "attempt_id", nullable = false)
    private UUID attemptId;

    /** Optional: competition context */
    @Column(name = "competition_id")
    private UUID competitionId;

    // ─── Violation classification ─────────────────────────────────────────
    @Column(name = "violation_type", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private ViolationType violationType;

    @Column(name = "risk_level", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private RiskLevel riskLevel;

    /** Source: BROWSER | SERVER */
    @Column(name = "source", nullable = false, length = 20)
    private String source = "BROWSER";

    // ─── Evidence ─────────────────────────────────────────────────────────
    /** Free-form JSON blob from client SDK: window sizes, timestamps, URLs, etc. */
    @Column(name = "evidence_json", columnDefinition = "JSONB")
    private String evidenceJson;

    /** Human-readable description of what was detected */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    // ─── Timing ───────────────────────────────────────────────────────────
    /** When the violation was detected on the client */
    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;

    /** Seconds elapsed since the attempt started when violation was detected */
    @Column(name = "elapsed_seconds")
    private Long elapsedSeconds;

    // ─── Network fingerprint ──────────────────────────────────────────────
    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    // ─── Moderation state ─────────────────────────────────────────────────
    /** Whether a moderator has reviewed and acknowledged this event */
    @Column(name = "reviewed", nullable = false)
    private Boolean reviewed = false;

    @Column(name = "reviewed_by", length = 255)
    private String reviewedBy;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "moderator_notes", columnDefinition = "TEXT")
    private String moderatorNotes;
}
