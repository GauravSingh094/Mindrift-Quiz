package com.mindrift.ai.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;
import java.util.UUID;

/** Response for POST /api/ai/quizzes/generate */
@Value @Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GeneratedQuizResponse {
    UUID generatedQuizId;
    String topic;
    String title;
    String description;
    String category;
    String difficulty;
    Integer questionCount;
    String status;       // DRAFT | FAILED
    String quizJson;     // Full structured quiz for immediate display
    Instant createdAt;
}
