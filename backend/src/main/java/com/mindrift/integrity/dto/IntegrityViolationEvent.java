package com.mindrift.integrity.dto;

import lombok.Builder;
import lombok.Value;

import java.time.Instant;
import java.util.UUID;

/** Kafka event published to integrity-events topic on significant integrity signals */
@Value
@Builder
public class IntegrityViolationEvent {

    String eventType;      // VIOLATION_RECORDED | RISK_ESCALATED | AUTO_DISQUALIFIED | MANUAL_DISQUALIFIED

    UUID violationId;
    UUID attemptId;
    UUID userId;
    UUID competitionId;

    String violationType;
    String riskLevel;
    int riskScore;

    boolean autoActionTriggered;
    String autoActionType;

    Instant occurredAt;
}
