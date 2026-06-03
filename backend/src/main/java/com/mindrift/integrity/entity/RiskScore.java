package com.mindrift.integrity.entity;

import com.mindrift.common.base.BaseEntity;
import com.mindrift.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Aggregated risk profile for a single quiz attempt.
 *
 * Maintained as an upsert: one row per attempt, updated after every new
 * ViolationEvent. The score and level drive automated actions:
 *
 *   score ≥ 90  → CRITICAL  → auto-disqualify
 *   score 65–89 → HIGH      → suspend + admin alert
 *   score 35–64 → MEDIUM    → flag for review, notify proctors
 *   score 10–34 → LOW       → log only
 *   score < 10  → SAFE
 */
@Getter
@Setter
@Entity
@Table(
    name = "risk_scores",
    indexes = {
        @Index(name = "idx_rs_attempt",   columnList = "attempt_id",   unique = true),
        @Index(name = "idx_rs_user",      columnList = "user_id"),
        @Index(name = "idx_rs_level",     columnList = "risk_level"),
        @Index(name = "idx_rs_score",     columnList = "risk_score DESC")
    }
)
public class RiskScore extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "attempt_id", nullable = false, unique = true)
    private UUID attemptId;

    @Column(name = "competition_id")
    private UUID competitionId;

    // ─── Score ────────────────────────────────────────────────────────────
    /** Computed risk score 0–100 */
    @Column(name = "risk_score", nullable = false)
    private Integer riskScore = 0;

    @Column(name = "risk_level", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private RiskLevel riskLevel = RiskLevel.SAFE;

    // ─── Violation counts ─────────────────────────────────────────────────
    @Column(name = "total_violations",    nullable = false)
    private Integer totalViolations = 0;

    @Column(name = "tab_switch_count",    nullable = false)
    private Integer tabSwitchCount = 0;

    @Column(name = "copy_paste_count",    nullable = false)
    private Integer copyPasteCount = 0;

    @Column(name = "fullscreen_exit_count", nullable = false)
    private Integer fullscreenExitCount = 0;

    @Column(name = "devtools_count",      nullable = false)
    private Integer devtoolsCount = 0;

    @Column(name = "rapid_change_count",  nullable = false)
    private Integer rapidChangeCount = 0;

    @Column(name = "server_side_count",   nullable = false)
    private Integer serverSideCount = 0;

    // ─── Automation state ─────────────────────────────────────────────────
    /** Whether automated action was taken (suspend/disqualify) */
    @Column(name = "auto_action_taken",   nullable = false)
    private Boolean autoActionTaken = false;

    @Column(name = "auto_action_type",    length = 50)
    private String autoActionType;   // SUSPENDED | DISQUALIFIED

    @Column(name = "auto_action_at")
    private Instant autoActionAt;

    // ─── First/Last violation timestamps ─────────────────────────────────
    @Column(name = "first_violation_at")
    private Instant firstViolationAt;

    @Column(name = "last_violation_at")
    private Instant lastViolationAt;
}
