package com.mindrift.user.controller;

import com.mindrift.common.response.ApiResponse;
import com.mindrift.common.security.UserPrincipal;
import com.mindrift.user.entity.User;
import com.mindrift.user.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/sync")
    public ResponseEntity<ApiResponse<User>> syncProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestHeader(value = "X-Device-Fingerprint", required = false) String deviceFingerprint,
            HttpServletRequest request) {

        String ipAddress = request.getHeader("X-Forwarded-For");
        if (ipAddress == null || ipAddress.isEmpty()) {
            ipAddress = request.getRemoteAddr();
        }

        String userAgent = request.getHeader("User-Agent");
        if (userAgent == null) {
            userAgent = "UNKNOWN";
        }

        User syncedUser = authService.syncProfile(principal, ipAddress, userAgent, deviceFingerprint);
        return ResponseEntity.ok(ApiResponse.success("Profile synchronized successfully", syncedUser));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserPrincipal>> getMe(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved successfully", principal));
    }
}
