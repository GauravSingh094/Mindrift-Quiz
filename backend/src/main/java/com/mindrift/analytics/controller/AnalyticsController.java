package com.mindrift.analytics.controller;

import com.mindrift.analytics.dto.*;
import com.mindrift.analytics.service.AnalyticsService;
import com.mindrift.common.exception.ResourceNotFoundException;
import com.mindrift.common.response.ApiResponse;
import com.mindrift.common.security.UserPrincipal;
import com.mindrift.quiz.entity.Quiz;
import com.mindrift.quiz.repository.QuizRepository;
import com.mindrift.user.entity.User;
import com.mindrift.user.entity.UserRole;
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
 * Analytics REST Controller.
 *
 * GET /api/analytics/me                         – authenticated user's analytics
 * GET /api/analytics/user/{userId}              – any user's analytics (admin only)
 * GET /api/analytics/quiz/{quizId}              – quiz analytics (creator or admin)
 * GET /api/analytics/competition/{competitionId}– competition analytics (organiser or admin)
 */
@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics", description = "User, quiz, competition and skill analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final UserRepository   userRepository;
    private final QuizRepository   quizRepository;

    // ─────────────────────────────────────────────────────────────────────────
    //  GET /analytics/me
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary     = "My Analytics",
        description = "Returns the complete analytics profile for the authenticated user — attempt history, skill breakdown, streaks, and historical score trends."
    )
    public ResponseEntity<ApiResponse<UserAnalyticsResponse>> getMyAnalytics(
            @AuthenticationPrincipal UserPrincipal principal) {

        UserAnalyticsResponse response = analyticsService.getUserAnalytics(principal.getId());
        return ResponseEntity.ok(ApiResponse.success("User analytics retrieved", response));
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  GET /analytics/user/{userId} (admin)
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    @Operation(
        summary     = "User Analytics (Admin)",
        description = "Returns full analytics for any user. Requires ADMIN role."
    )
    public ResponseEntity<ApiResponse<UserAnalyticsResponse>> getUserAnalytics(
            @Parameter(description = "UUID of the user", required = true)
            @PathVariable UUID userId) {

        UserAnalyticsResponse response = analyticsService.getUserAnalytics(userId);
        return ResponseEntity.ok(ApiResponse.success("User analytics retrieved", response));
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  GET /analytics/quiz/{quizId}
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/quiz/{quizId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary     = "Quiz Analytics",
        description = "Returns analytics for a specific quiz. Only the quiz creator and admins can access this endpoint."
    )
    public ResponseEntity<ApiResponse<QuizAnalyticsResponse>> getQuizAnalytics(
            @Parameter(description = "UUID of the quiz", required = true)
            @PathVariable UUID quizId,
            @AuthenticationPrincipal UserPrincipal principal) {

        // Access control: only quiz creator or admin
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found: " + quizId));

        boolean isAdmin   = principal.getRole() == UserRole.ROLE_ADMIN
                         || principal.getRole() == UserRole.ROLE_SUPER_ADMIN;
        boolean isCreator = quiz.getCreator().getId().equals(principal.getId());

        if (!isAdmin && !isCreator) {
            return ResponseEntity.status(403)
                    .body(ApiResponse.error("Only the quiz creator or an admin can view quiz analytics",
                            "FORBIDDEN"));
        }

        QuizAnalyticsResponse response = analyticsService.getQuizAnalytics(quizId);
        return ResponseEntity.ok(ApiResponse.success("Quiz analytics retrieved", response));
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  GET /analytics/competition/{competitionId}
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/competition/{competitionId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary     = "Competition Analytics",
        description = "Returns post-competition analytics including participation, score distribution, and top-3 rankings."
    )
    public ResponseEntity<ApiResponse<CompetitionAnalyticsResponse>> getCompetitionAnalytics(
            @Parameter(description = "UUID of the competition", required = true)
            @PathVariable UUID competitionId,
            @AuthenticationPrincipal UserPrincipal principal) {

        CompetitionAnalyticsResponse response = analyticsService.getCompetitionAnalytics(competitionId);
        return ResponseEntity.ok(ApiResponse.success("Competition analytics retrieved", response));
    }
}
