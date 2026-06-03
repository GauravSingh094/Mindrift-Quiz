package com.mindrift.integrity.dto;

import com.mindrift.integrity.entity.RiskLevel;
import com.mindrift.integrity.entity.ViolationType;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;
import java.util.UUID;

/** Single violation row in an integrity report */
@Value
@Builder
public class ViolationEventDto {
    UUID violationId;
    ViolationType violationType;
    RiskLevel riskLevel;
    String source;
    String description;
    Long elapsedSeconds;
    Instant occurredAt;
    String evidenceJson;
    boolean reviewed;
}
