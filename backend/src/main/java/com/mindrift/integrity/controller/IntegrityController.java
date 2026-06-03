package com.mindrift.integrity.controller;

import com.mindrift.common.response.ApiResponse;
import com.mindrift.common.security.UserPrincipal;
import com.mindrift.integrity.dto.*;
import com.mindrift.integrity.service.IntegrityService;
import com.mindrift.user.entity.User;
import com.mindrift.user.entity.UserRole;
import com.mindrift.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Anti-Cheat & Integrity REST Controller.
 *
 * POST   /api/integrity/violations               – Browser SDK reports a violation
 * GET    /api/integrity/reports/{attemptId}      – Retrieve integrity report
 * GET    /api/integrity/reports/user/{userId}    – All reports for a user (admin)
 * GET    /api/integrity/moderation/queue         – Pending moderation queue (admin)
 * POST   /api/integrity/moderation/disqualify    – Manual disqualification (admin)
 * PATCH  /api/integrity/moderation/{reportId}    – Moderate a report (admin)
 */
@RestController
@RequestMapping("/api/integrity")
@RequiredArgsConstructor
@Tag(name = "Integrity", description = "Anti-cheat, violation reporting, and moderation endpoints")
public class IntegrityController {

    private final IntegrityService integrityService;
    private final UserRepository   userRepository;

    // ─────────────────────────────────────────────────────────────────────────
    //  POST /violations  (Browser SDK)
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/violations")
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary     = "Report Violation",
        description = "Called by the browser SDK when it detects an integrity violation (tab switch, paste, devtools, etc.). " +
                      "Returns the updated risk score and a client action directive."
    )
    public ResponseEntity<ApiResponse<ViolationResponse>> reportViolation(
            @Valid @RequestBody ReportViolationRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest httpRequest) {

        User user = resolveUser(principal.getId());
        String ipAddress = extractIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        ViolationResponse response = integrityService.recordViolation(request, user, ipAddress, userAgent);

        HttpStatus status = switch (response.getClientAction()) {
            case "TERMINATE", "SUSPEND" -> HttpStatus.OK; // always 200 but client should act
            default -> HttpStatus.CREATED;
        };

        return ResponseEntity.status(status)
                .body(ApiResponse.success("Violation recorded", response));
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  GET /reports/{attemptId}
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/reports/{attemptId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary     = "Get Integrity Report",
        description = "Returns the full integrity report for a quiz attempt. " +
                      "Users can only view their own reports; admins can view any."
    )
    public ResponseEntity<ApiResponse<IntegrityReportResponse>> getReport(
            @Parameter(description = "UUID of the quiz attempt")
            @PathVariable UUID attemptId,
            @AuthenticationPrincipal UserPrincipal principal) {

        IntegrityReportResponse report = integrityService.getReport(attemptId);

        // Access guard: user can only view own report, admins can view all
        boolean isAdmin = principal.getRole() == UserRole.ROLE_ADMIN
                       || principal.getRole() == UserRole.ROLE_SUPER_ADMIN;
        boolean isOwner = report.getUserId().equals(principal.getId());

        if (!isAdmin && !isOwner) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Not authorised to view this report", "FORBIDDEN"));
        }

        return ResponseEntity.ok(ApiResponse.success("Integrity report retrieved", report));
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  GET /reports/user/{userId}  (admin)
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/reports/user/{userId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    @Operation(
        summary = "Get Reports for User (Admin)",
        description = "Returns all integrity reports for a specific user. Admin only."
    )
    public ResponseEntity<ApiResponse<Page<IntegrityReportResponse>>> getReportsByUser(
            @PathVariable UUID userId,
            @ParameterObject @PageableDefault(size = 20) Pageable pageable) {

        Page<IntegrityReportResponse> page = integrityService.getReportsByUser(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success("User integrity reports retrieved", page));
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  GET /moderation/queue  (admin)
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/moderation/queue")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    @Operation(
        summary = "Moderation Queue",
        description = "Returns pending integrity reports requiring moderator review, ordered by risk score descending."
    )
    public ResponseEntity<ApiResponse<Page<IntegrityReportResponse>>> getModerationQueue(
            @ParameterObject @PageableDefault(size = 25) Pageable pageable) {

        Page<IntegrityReportResponse> queue = integrityService.getPendingModerationQueue(pageable);
        return ResponseEntity.ok(ApiResponse.success("Moderation queue retrieved", queue));
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  POST /moderation/disqualify  (admin)
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/moderation/disqualify")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    @Operation(
        summary     = "Disqualify Attempt",
        description = "Manually disqualifies a quiz attempt after integrity review. " +
                      "Optionally invalidates the score and notifies the user. Admin only."
    )
    public ResponseEntity<ApiResponse<IntegrityReportResponse>> disqualify(
            @Valid @RequestBody DisqualifyRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest httpRequest) {

        User moderator = resolveUser(principal.getId());
        String ipAddress = extractIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        IntegrityReportResponse response = integrityService.disqualify(
                request, moderator, ipAddress, userAgent);

        return ResponseEntity.ok(ApiResponse.success("Attempt disqualified", response));
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  PATCH /moderation/{reportId}  (admin)
    // ─────────────────────────────────────────────────────────────────────────

    @PatchMapping("/moderation/{reportId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    @Operation(
        summary = "Moderate Report",
        description = "Updates the moderation status of an integrity report. " +
                      "Allowed decisions: CLEARED, WARNED, SCORE_INVALIDATED, REVIEWING."
    )
    public ResponseEntity<ApiResponse<IntegrityReportResponse>> moderateReport(
            @PathVariable UUID reportId,
            @RequestParam String decision,
            @RequestParam(required = false) String notes,
            @AuthenticationPrincipal UserPrincipal principal) {

        // Validate decision
        java.util.Set<String> validDecisions = java.util.Set.of(
                "CLEARED", "WARNED", "SCORE_INVALIDATED", "REVIEWING");
        if (!validDecisions.contains(decision.toUpperCase())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Invalid decision. Must be one of: " + validDecisions,
                            "VALIDATION_ERROR"));
        }

        User moderator = resolveUser(principal.getId());
        IntegrityReportResponse response = integrityService.moderateReport(
                reportId, decision.toUpperCase(), notes, moderator);

        return ResponseEntity.ok(ApiResponse.success("Report updated", response));
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private User resolveUser(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new com.mindrift.common.exception.ResourceNotFoundException(
                        "User not found: " + id));
    }

    private String extractIp(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        return (xff != null && !xff.isBlank()) ? xff.split(",")[0].trim() : req.getRemoteAddr();
    }
}
