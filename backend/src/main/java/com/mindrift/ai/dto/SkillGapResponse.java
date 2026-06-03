package com.mindrift.ai.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value @Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SkillGapResponse {

    String overallLevel;
    List<String> strengths;
    List<GapDto> gaps;
    String summary;
    String recommendedNextStep;
    String provider;

    @Value @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class GapDto {
        String category;
        double currentLevel;
        double targetLevel;
        String priority;
        List<String> recommendedFocusAreas;
    }
}
