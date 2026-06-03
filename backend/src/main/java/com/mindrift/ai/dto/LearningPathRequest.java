package com.mindrift.ai.dto;

import jakarta.validation.constraints.*;
import lombok.Builder;
import lombok.Value;
import lombok.extern.jackson.Jacksonized;

/** POST /api/ai/learning-path */
@Value @Builder @Jacksonized
public class LearningPathRequest {

    @NotBlank
    String targetSkill;

    String currentLevel; // BEGINNER|INTERMEDIATE|ADVANCED
    String skillGapsJson; // from SkillGapResponse (pre-computed or fresh)

    @Min(1) @Max(52)
    Integer weeksDuration;

    String preferredProvider;
}
