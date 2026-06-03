package com.mindrift.analytics.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Analytics breakdown for a single quiz.
 * Returned by GET /api/analytics/quiz/{quizId}
 */
@Value
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class QuizAnalyticsResponse {

    UUID quizId;
    String quizTitle;
    UUID categoryId;
    String categoryName;

    // ─── Volume ──────────────────────────────────────────────────────────
    long totalAttempts;
    long uniquePlayers;
    long submittedAttempts;
    long expiredAttempts;
    double completionRate;

    // ─── Score distribution ───────────────────────────────────────────────
    double averageScore;
    double averagePercentage;
    double highestScore;
    double lowestScore;
    long passCount;
    double passRate;
    long perfectScoreCount;
    double repeatAttemptRate;

    // ─── Timing ───────────────────────────────────────────────────────────
    long averageTimeSeconds;
    long fastestCompletionSeconds;

    // ─── Question difficulty insights ─────────────────────────────────────
    List<QuestionInsightDto> questionInsights;
    UUID hardestQuestionId;
    UUID easiestQuestionId;

    // ─── Historical trend ─────────────────────────────────────────────────
    List<SnapshotPointDto> attemptsTrend;

    Instant lastAttemptedAt;
}
