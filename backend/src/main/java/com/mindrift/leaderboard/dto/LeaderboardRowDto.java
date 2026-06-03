package com.mindrift.leaderboard.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;
import java.util.UUID;

/**
 * A single row in any leaderboard response.
 */
@Value
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LeaderboardRowDto {

    int rank;
    UUID userId;
    String username;
    String displayName;
    String avatarUrl;
    double totalScore;
    long totalAttempts;
    long perfectScores;
    double averageScore;
    Integer streakDays;
    Instant lastActive;

    /** True when this row belongs to the requesting user */
    boolean isCurrentUser;
}
