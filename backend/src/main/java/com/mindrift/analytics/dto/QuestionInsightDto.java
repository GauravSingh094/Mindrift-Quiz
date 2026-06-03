package com.mindrift.analytics.dto;

import lombok.Builder;
import lombok.Value;

import java.util.UUID;

/** Single question accuracy insight in quiz analytics */
@Value
@Builder
public class QuestionInsightDto {
    UUID questionId;
    String questionText;
    long totalAnswered;
    long correctCount;
    double accuracyRate;
    /** Difficulty label inferred from accuracy: EASY / MEDIUM / HARD */
    String inferredDifficulty;
}
