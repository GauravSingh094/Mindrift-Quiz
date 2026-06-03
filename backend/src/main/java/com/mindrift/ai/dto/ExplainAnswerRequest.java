package com.mindrift.ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Value;
import lombok.extern.jackson.Jacksonized;

import java.util.UUID;

/** POST /api/ai/explain */
@Value @Builder @Jacksonized
public class ExplainAnswerRequest {
    UUID questionId;
    @NotBlank String questionText;
    @NotBlank String correctAnswer;
    String userAnswer;
    String context;
}
