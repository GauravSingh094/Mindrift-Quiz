package com.mindrift.integrity.entity;

import com.mindrift.common.base.BaseEntity;
import com.mindrift.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Full integrity report generated when an attempt concludes or is escalated.
 *
 * Aggregates all ViolationEvents, the final RiskScore, the proctoring session
 * summary, and the moderator's decision into one auditable document.
 */
@Getter
@Setter
@Entity
@Table(
    name = "integrity_reports",
    indexes = {
        @Index(name = "idx_ir_attempt",    columnList = "attempt_id", unique = true),
        @Index(name = "idx_ir_user",       columnList = "user_id"),
        @Index(name = "idx_ir_status",     columnList = "moderation_status"),
        @Index(name = "idx_ir_risk",       columnList = "risk_level"),
        @Index(name = "idx_ir_generated",  columnList = "generated_at DESC")
    }
)
public class IntegrityReport extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "attempt_id", nullable = false, unique = true)
    private UUID attemptId;

    @Column(name = "competition_id")
    private UUID competitionId;

    // ─── Risk summary ─────────────────────────────────────────────────────
    @Column(name = "risk_score",  nullable = false)
    private Integer riskScore = 0;

    @Column(name = "risk_level",  nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private RiskLevel riskLevel = RiskLevel.SAFE;

    @Column(name = "total_violations", nullable = false)
    private Integer totalViolations = 0;

    /** JSON summary of violation type counts: {"TAB_SWITCH":3,"DEVTOOLS_OPEN":1} */
    @Column(name = "violation_summary", columnDefinition = "JSONB")
    private String violationSummary = "{}";

    // ─── Proctoring summary ───────────────────────────────────────────────
    @Column(name = "proctoring_session_id")
    private UUID proctoringSessionId;

    @Column(name = "face_detection_rate")
    private Double faceDetectionRate;

    @Column(name = "was_proctored",  nullable = false)
    private Boolean wasProctored = false;

    // ─── Moderation ───────────────────────────────────────────────────────
    /** PENDING | REVIEWING | CLEARED | WARNED | SCORE_INVALIDATED | DISQUALIFIED */
    @Column(name = "moderation_status", nullable = false, length = 30)
    private String moderationStatus = "PENDING";

    @Column(name = "moderator_id")
    private UUID moderatorId;

    @Column(name = "moderator_username", length = 255)
    private String moderatorUsername;

    @Column(name = "moderation_notes", columnDefinition = "TEXT")
    private String moderationNotes;

    @Column(name = "moderated_at")
    private Instant moderatedAt;

    // ─── Auto-action ──────────────────────────────────────────────────────
    @Column(name = "auto_disqualified", nullable = false)
    private Boolean autoDisqualified = false;

    @Column(name = "auto_disqualified_at")
    private Instant autoDisqualifiedAt;

    @Column(name = "auto_disqualification_reason", columnDefinition = "TEXT")
    private String autoDisqualificationReason;

    // ─── Timestamps ───────────────────────────────────────────────────────
    @Column(name = "generated_at",  nullable = false)
    private Instant generatedAt;

    @Column(name = "attempt_start_time")
    private Instant attemptStartTime;

    @Column(name = "attempt_end_time")
    private Instant attemptEndTime;
}
