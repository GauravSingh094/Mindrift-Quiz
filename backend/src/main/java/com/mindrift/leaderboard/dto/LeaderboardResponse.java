package com.mindrift.leaderboard.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Full leaderboard response including metadata, top rows, and the caller's own rank.
 */
@Value
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LeaderboardResponse {

    /** "GLOBAL" | "CATEGORY" | "COMPETITION" | "SEASON" */
    String scope;

    /** Category ID for CATEGORY scope */
    UUID categoryId;

    /** Category name for CATEGORY scope */
    String categoryName;

    /** Competition ID for COMPETITION scope */
    UUID competitionId;

    /** Season details for SEASON scope */
    SeasonDto season;

    /** Top entries (default: top 100 cached) */
    List<LeaderboardRowDto> entries;

    /** Total participants in this leaderboard */
    long totalParticipants;

    /** Caller's own rank entry (null if not authenticated or not ranked) */
    LeaderboardRowDto myRank;

    /** Cached-at timestamp so clients know data freshness */
    Instant cachedAt;
}
