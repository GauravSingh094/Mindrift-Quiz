package com.mindrift.integrity.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.mindrift.integrity.entity.RiskLevel;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Full integrity report for GET /api/integrity/reports/{id}.
 * Also returned after a moderation action.
 */
@Value
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class IntegrityReportResponse {

    UUID reportId;
    UUID attemptId;
    UUID userId;
    String username;
    UUID competitionId;

    // ─── Risk summary ─────────────────────────────────────────────────────
    int riskScore;
    RiskLevel riskLevel;
    int totalViolations;
    Map<String, Long> violationBreakdown;  // type → count

    // ─── Violation timeline ───────────────────────────────────────────────
    List<ViolationEventDto> violations;

    // ─── Proctoring ───────────────────────────────────────────────────────
    boolean wasProctored;
    Double faceDetectionRate;
    ProctoringSessionDto proctoringSession;

    // ─── Moderation ───────────────────────────────────────────────────────
    String moderationStatus;
    String moderatorUsername;
    String moderationNotes;
    Instant moderatedAt;

    // ─── Auto-action ──────────────────────────────────────────────────────
    boolean autoDisqualified;
    Instant autoDisqualifiedAt;
    String autoDisqualificationReason;

    // ─── Timestamps ───────────────────────────────────────────────────────
    Instant generatedAt;
    Instant attemptStartTime;
    Instant attemptEndTime;
}
