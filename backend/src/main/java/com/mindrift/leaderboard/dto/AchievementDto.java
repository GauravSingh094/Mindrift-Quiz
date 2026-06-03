package com.mindrift.leaderboard.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.mindrift.leaderboard.entity.AchievementType;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;
import java.util.UUID;

/**
 * Represents a single earned achievement badge.
 */
@Value
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AchievementDto {

    UUID id;
    AchievementType type;
    String displayName;
    String description;
    Instant earnedAt;
    String context;

    /** Badge icon key — front-end maps this to an SVG/image */
    String iconKey;
}
