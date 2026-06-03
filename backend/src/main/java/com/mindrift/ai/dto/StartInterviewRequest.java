package com.mindrift.ai.dto;

import jakarta.validation.constraints.*;
import lombok.Builder;
import lombok.Value;
import lombok.extern.jackson.Jacksonized;

import java.util.List;

/** POST /api/ai/interview/start */
@Value @Builder @Jacksonized
public class StartInterviewRequest {

    @NotBlank
    String topic;

    @NotBlank
    String roleTitle;

    @Pattern(regexp = "JUNIOR|MID|SENIOR|LEAD")
    String experienceLevel;

    List<String> focusAreas;

    @Min(3) @Max(20)
    Integer totalQuestions;
}
