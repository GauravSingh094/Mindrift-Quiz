package com.mindrift.analytics.dto;

import lombok.Builder;
import lombok.Value;

import java.util.UUID;

/** Summary skill row embedded in UserAnalyticsResponse */
@Value
@Builder
public class SkillSummaryDto {
    UUID categoryId;
    String categoryName;
    double masteryScore;
    String skillLevel;
    double accuracyInCategory;
    long attemptsInCategory;
    String trend;          // IMPROVING | STABLE | DECLINING
}
