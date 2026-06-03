package com.mindrift.user.controller;

import com.mindrift.common.response.ApiResponse;
import com.mindrift.common.security.UserPrincipal;
import com.mindrift.user.entity.UserSession;
import com.mindrift.user.service.SessionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;

    @GetMapping("/active")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<UserSession>>> getActiveSessions(@AuthenticationPrincipal UserPrincipal principal) {
        log.info("Request to get active device sessions for user: {}", principal.getId());
        List<UserSession> activeSessions = sessionService.getActiveSessions(principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Active device sessions retrieved successfully", activeSessions));
    }

    @PostMapping("/{id}/invalidate")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> invalidateSession(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        log.info("Request to terminate session {} by user {}", id, principal.getId());
        // Verify session belongs to user or is admin
        sessionService.invalidateSession(id);
        return ResponseEntity.ok(ApiResponse.success("Device session terminated successfully"));
    }

    @PostMapping("/invalidate-all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> invalidateAllSessions(@AuthenticationPrincipal UserPrincipal principal) {
        log.info("Request to terminate all concurrent sessions for user {}", principal.getId());
        sessionService.invalidateAllUserSessions(principal.getId());
        return ResponseEntity.ok(ApiResponse.success("All other concurrent device sessions terminated successfully"));
    }
}
