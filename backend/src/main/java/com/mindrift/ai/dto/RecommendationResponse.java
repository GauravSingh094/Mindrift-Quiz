package com.mindrift.ai.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Value @Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RecommendationResponse {
    UUID recommendationId;
    String type;
    String rationale;
    List<RecommendedItem> items;
    Instant expiresAt;
    Instant generatedAt;

    @Value @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class RecommendedItem {
        int rank;
        String entityId;
        String entityType;
        String title;
        String reason;
        double confidenceScore;
    }
}
