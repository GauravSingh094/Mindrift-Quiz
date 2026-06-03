package com.mindrift.analytics.dto;

import lombok.Builder;
import lombok.Value;

import java.util.UUID;

/** Top-player entry embedded in CompetitionAnalyticsResponse */
@Value
@Builder
public class TopPlayerDto {
    int rank;
    UUID userId;
    String username;
    String displayName;
    String avatarUrl;
    double score;
}
