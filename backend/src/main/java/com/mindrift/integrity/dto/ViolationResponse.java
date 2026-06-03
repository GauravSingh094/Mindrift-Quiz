package com.mindrift.integrity.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.mindrift.integrity.entity.RiskLevel;
import com.mindrift.integrity.entity.ViolationType;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;
import java.util.UUID;

/** Response returned by POST /api/integrity/violations */
@Value
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ViolationResponse {
    UUID violationId;
    UUID attemptId;
    ViolationType violationType;
    RiskLevel violationRiskLevel;

    /** Updated aggregate risk score after this violation was applied */
    int updatedRiskScore;
    RiskLevel updatedRiskLevel;

    /** Whether an automated action was triggered by this violation */
    boolean autoActionTriggered;
    String autoActionType;

    /** Client should react to this (e.g. show warning modal or end session) */
    String clientAction;  // NONE | WARN | SUSPEND | TERMINATE

    Instant processedAt;
}
