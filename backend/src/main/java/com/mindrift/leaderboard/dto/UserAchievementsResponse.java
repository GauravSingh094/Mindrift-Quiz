package com.mindrift.leaderboard.dto;

import lombok.Builder;
import lombok.Value;

import java.util.List;

/**
 * Aggregated view of a user's achievements profile.
 */
@Value
@Builder
public class UserAchievementsResponse {

    String userId;
    String username;
    long totalAchievements;
    List<AchievementDto> achievements;
}
