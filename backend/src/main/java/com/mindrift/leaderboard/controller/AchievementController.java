package com.mindrift.leaderboard.controller;

import com.mindrift.common.exception.ResourceNotFoundException;
import com.mindrift.common.response.ApiResponse;
import com.mindrift.common.security.UserPrincipal;
import com.mindrift.leaderboard.dto.UserAchievementsResponse;
import com.mindrift.leaderboard.service.AchievementService;
import com.mindrift.user.entity.User;
import com.mindrift.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Achievement REST Controller
 *
 * GET /api/v1/achievements/me              – caller's achievements
 * GET /api/v1/achievements/user/{userId}   – public achievements for any user
 */
@RestController
@RequestMapping("/api/achievements")
@RequiredArgsConstructor
@Tag(name = "Achievements", description = "User achievement badges and milestones")
public class AchievementController {

    private final AchievementService achievementService;
    private final UserRepository userRepository;

    // ─────────────────────────────────────────────────────────────────────────
    //  GET /achievements/me
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary     = "My achievements",
        description = "Returns all achievement badges earned by the authenticated user, sorted by most recently earned."
    )
    public ResponseEntity<ApiResponse<UserAchievementsResponse>> getMyAchievements(
            @AuthenticationPrincipal UserPrincipal principal) {

        User user = resolveUser(principal.getId());
        return ResponseEntity.ok(
                ApiResponse.success("Achievements retrieved", achievementService.getAchievements(user)));
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  GET /achievements/user/{userId}
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/user/{userId}")
    @Operation(
        summary     = "Public user achievements",
        description = "Returns the achievement badges for any user by their platform UUID."
    )
    public ResponseEntity<ApiResponse<UserAchievementsResponse>> getUserAchievements(
            @Parameter(description = "UUID of the user", required = true)
            @PathVariable UUID userId) {

        User user = resolveUser(userId);
        return ResponseEntity.ok(
                ApiResponse.success("Achievements retrieved", achievementService.getAchievements(user)));
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  HELPER
    // ─────────────────────────────────────────────────────────────────────────

    private User resolveUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
    }
}
