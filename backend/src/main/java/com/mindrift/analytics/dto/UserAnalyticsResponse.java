package com.mindrift.analytics.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Full analytics profile for the authenticated user.
 * Returned by GET /api/analytics/me
 */
@Value
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserAnalyticsResponse {

    UUID userId;
    String username;
    String displayName;
    String avatarUrl;

    // ─── Attempt metrics ─────────────────────────────────────────────────
    long totalAttempts;
    long submittedAttempts;
    long passedAttempts;
    long perfectScoreCount;
    double passRate;

    // ─── Score metrics ───────────────────────────────────────────────────
    double totalScore;
    double averageScore;
    double bestScore;
    double averagePercentage;

    // ─── Question accuracy ────────────────────────────────────────────────
    long totalQuestionsAnswered;
    long totalCorrect;
    long totalIncorrect;
    long totalUnanswered;
    double accuracyRate;

    // ─── Time ────────────────────────────────────────────────────────────
    long totalTimeSpentSeconds;
    long averageTimePerAttemptSeconds;

    // ─── Streak ──────────────────────────────────────────────────────────
    int currentStreakDays;
    int longestStreakDays;
    Instant lastActiveAt;

    // ─── Skill breakdown ─────────────────────────────────────────────────
    List<SkillSummaryDto> skillBreakdown;

    // ─── Difficulty breakdown ─────────────────────────────────────────────
    Map<String, Long>   attemptsPerDifficulty;
    Map<String, Double> avgScorePerDifficulty;

    // ─── Favourite category ────────────────────────────────────────────────
    UUID favouriteCategoryId;
    String favouriteCategoryName;

    // ─── Competitions ─────────────────────────────────────────────────────
    long competitionParticipations;
    long competitionWins;
    double competitionWinRate;

    // ─── Historical snapshots ──────────────────────────────────────────────
    List<SnapshotPointDto> scoreHistory;
}
