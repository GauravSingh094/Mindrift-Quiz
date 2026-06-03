package com.mindrift.leaderboard.controller;

import com.mindrift.common.response.ApiResponse;
import com.mindrift.leaderboard.dto.LeaderboardResponse;
import com.mindrift.leaderboard.service.LeaderboardService;
import com.mindrift.common.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Leaderboard REST Controller
 *
 * GET /api/v1/leaderboards/global
 * GET /api/v1/leaderboards/category/{categoryId}
 * GET /api/v1/leaderboards/competition/{competitionId}
 * GET /api/v1/leaderboards/season/{seasonId}
 * GET /api/v1/leaderboards/season/active
 */
@RestController
@RequestMapping("/api/leaderboards")
@RequiredArgsConstructor
@Tag(name = "Leaderboards", description = "Global, category, competition, and seasonal rankings")
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    // ─────────────────────────────────────────────────────────────────────────
    //  GET /leaderboards/global
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/global")
    @Operation(
        summary     = "Global leaderboard",
        description = "Returns the top 100 players globally. If authenticated, also returns the caller's own rank even if outside top 100."
    )
    public ResponseEntity<ApiResponse<LeaderboardResponse>> getGlobal(
            @AuthenticationPrincipal UserPrincipal principal) {

        UUID userId = principal != null ? principal.getId() : null;
        LeaderboardResponse response = leaderboardService.getGlobal(userId);
        return ResponseEntity.ok(ApiResponse.success("Global leaderboard retrieved", response));
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  GET /leaderboards/category/{categoryId}
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/category/{categoryId}")
    @Operation(
        summary     = "Category leaderboard",
        description = "Returns top 100 for a specific quiz category. Also returns the caller's rank."
    )
    public ResponseEntity<ApiResponse<LeaderboardResponse>> getCategory(
            @Parameter(description = "UUID of the category", required = true)
            @PathVariable UUID categoryId,
            @AuthenticationPrincipal UserPrincipal principal) {

        UUID userId = principal != null ? principal.getId() : null;
        LeaderboardResponse response = leaderboardService.getCategory(categoryId, userId);
        return ResponseEntity.ok(ApiResponse.success("Category leaderboard retrieved", response));
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  GET /leaderboards/competition/{competitionId}
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/competition/{competitionId}")
    @Operation(
        summary     = "Competition leaderboard",
        description = "Live competition ranking sourced from Redis ZSET. Updated in real-time as participants submit answers."
    )
    public ResponseEntity<ApiResponse<LeaderboardResponse>> getCompetition(
            @Parameter(description = "UUID of the competition", required = true)
            @PathVariable UUID competitionId,
            @AuthenticationPrincipal UserPrincipal principal) {

        UUID userId = principal != null ? principal.getId() : null;
        LeaderboardResponse response = leaderboardService.getCompetition(competitionId, userId);
        return ResponseEntity.ok(ApiResponse.success("Competition leaderboard retrieved", response));
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  GET /leaderboards/season/{seasonId}
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/season/{seasonId}")
    @Operation(
        summary     = "Seasonal leaderboard by ID",
        description = "Returns rankings for a specific seasonal leaderboard."
    )
    public ResponseEntity<ApiResponse<LeaderboardResponse>> getSeason(
            @Parameter(description = "UUID of the season", required = true)
            @PathVariable UUID seasonId,
            @AuthenticationPrincipal UserPrincipal principal) {

        UUID userId = principal != null ? principal.getId() : null;
        LeaderboardResponse response = leaderboardService.getSeason(seasonId, userId);
        return ResponseEntity.ok(ApiResponse.success("Seasonal leaderboard retrieved", response));
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  GET /leaderboards/season/active
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/season/active")
    @Operation(
        summary     = "Active season leaderboard",
        description = "Convenience endpoint — returns rankings for whichever season is currently active."
    )
    public ResponseEntity<ApiResponse<LeaderboardResponse>> getActiveSeason(
            @AuthenticationPrincipal UserPrincipal principal) {

        // Resolve active season ID from DB and delegate
        UUID userId = principal != null ? principal.getId() : null;
        LeaderboardResponse response = leaderboardService.getActiveSeason(userId);
        return ResponseEntity.ok(ApiResponse.success("Active season leaderboard retrieved", response));
    }
}
