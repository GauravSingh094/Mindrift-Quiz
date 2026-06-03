package com.mindrift.ai.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Value @Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LearningPathResponse {
    UUID learningPathId;
    String title;
    String description;
    String targetSkill;
    Integer estimatedHours;
    String difficulty;
    Integer totalMilestones;
    Double progressPercentage;
    String status;
    List<MilestoneDto> milestones;
    Instant startedAt;

    @Value @Builder
    public static class MilestoneDto {
        int milestoneIndex;
        String title;
        String description;
        List<String> topics;
        int estimatedHours;
    }
}
