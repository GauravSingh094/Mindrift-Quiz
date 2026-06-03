package com.mindrift.analytics.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Analytics for a competition.
 * Returned by GET /api/analytics/competition/{competitionId}
 */
@Value
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CompetitionAnalyticsResponse {

    UUID competitionId;
    String competitionTitle;
    UUID quizId;
    UUID organizerId;

    // ─── Participation ────────────────────────────────────────────────────
    long registeredCount;
    long activeCount;
    long completedCount;
    long disqualifiedCount;
    double dropoutRate;

    // ─── Score stats ──────────────────────────────────────────────────────
    double averageScore;
    double highestScore;
    double lowestScore;
    double medianScore;
    double passRate;

    // ─── Top players ──────────────────────────────────────────────────────
    List<TopPlayerDto> top3;

    // ─── Timing ───────────────────────────────────────────────────────────
    Instant startedAt;
    Instant endedAt;
    int durationMinutes;
    long averageCompletionSeconds;
    int totalRounds;

    // ─── Winner ───────────────────────────────────────────────────────────
    UUID winnerUserId;
    String winnerUsername;
    Double winnerScore;
}
