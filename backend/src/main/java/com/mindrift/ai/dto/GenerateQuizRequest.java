package com.mindrift.ai.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.*;
import lombok.Builder;
import lombok.Value;
import lombok.extern.jackson.Jacksonized;

/** POST /api/ai/quizzes/generate */
@Value @Builder @Jacksonized
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GenerateQuizRequest {

    @NotBlank(message = "Topic is required")
    @Size(max = 200)
    String topic;

    @NotBlank
    @Size(max = 100)
    String category;

    @Pattern(regexp = "EASY|MEDIUM|HARD|MIXED", message = "Must be EASY, MEDIUM, HARD, or MIXED")
    String difficulty;

    @Min(2) @Max(50)
    Integer questionCount;

    /** Optional: en, es, fr, de, … Default = English */
    String language;

    /** Optional: provider preference (GEMINI|OPENAI|CLAUDE) */
    String preferredProvider;
}
