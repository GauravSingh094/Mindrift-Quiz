package com.mindrift.quiz.controller;

import com.mindrift.common.exception.ResourceNotFoundException;
import com.mindrift.common.response.ApiResponse;
import com.mindrift.common.security.UserPrincipal;
import com.mindrift.quiz.dto.*;
import com.mindrift.quiz.service.QuizAttemptService;
import com.mindrift.user.entity.User;
import com.mindrift.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Quiz Attempt REST Controller — /api/attempts & /api/quizzes/{quizId}/attempts
 *
 * POST   /api/quizzes/{quizId}/attempts/start   → Start attempt
 * PATCH  /api/attempts/{id}/answer              → Save/update single answer
 * GET    /api/attempts/{id}/progress            → Get current session state (reconnect)
 * POST   /api/attempts/{id}/submit              → Submit attempt (idempotent)
 * GET    /api/attempts/{id}/result              → Get scored result
 * GET    /api/attempts/my                       → My attempt history (paginated)
 */
@Slf4j
@RestController
@RequiredArgsConstructor
public class QuizAttemptController {

    private final QuizAttemptService quizAttemptService;
    private final UserRepository userRepository;

    // ─────────────────────────────────────────────────────────────────
    //  START ATTEMPT
    // ─────────────────────────────────────────────────────────────────

    @PostMapping("/api/quizzes/{quizId}/attempts/start")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<StartAttemptResponse>> startAttempt(
            @PathVariable UUID quizId,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest http) {

        User user = resolveUser(principal);
        StartAttemptResponse response =
                quizAttemptService.startAttempt(quizId, user, getIp(http), getUa(http));

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Quiz attempt started successfully", response));
    }

    // ─────────────────────────────────────────────────────────────────
    //  SAVE ANSWER (auto-save / progress save)
    // ─────────────────────────────────────────────────────────────────

    @PatchMapping("/api/attempts/{id}/answer")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<AttemptProgressResponse>> saveAnswer(
            @PathVariable UUID id,
            @Valid @RequestBody SaveAnswerRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest http) {

        User user = resolveUser(principal);
        AttemptProgressResponse progress =
                quizAttemptService.saveAnswer(id, request, user, getIp(http), getUa(http));

        return ResponseEntity.ok(ApiResponse.success("Answer saved successfully", progress));
    }

    // ─────────────────────────────────────────────────────────────────
    //  GET PROGRESS (for reconnect / resume)
    // ─────────────────────────────────────────────────────────────────

    @GetMapping("/api/attempts/{id}/progress")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<AttemptProgressResponse>> getProgress(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {

        User user = resolveUser(principal);
        AttemptProgressResponse progress = quizAttemptService.getProgress(id, user);
        return ResponseEntity.ok(ApiResponse.success("Attempt progress retrieved", progress));
    }

    // ─────────────────────────────────────────────────────────────────
    //  SUBMIT ATTEMPT (idempotent)
    // ─────────────────────────────────────────────────────────────────

    @PostMapping("/api/attempts/{id}/submit")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<QuizResultResponse>> submitAttempt(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest http) {

        User user = resolveUser(principal);
        QuizResultResponse result =
                quizAttemptService.submitAttempt(id, user, getIp(http), getUa(http));

        return ResponseEntity.ok(ApiResponse.success("Attempt submitted and scored successfully", result));
    }

    // ─────────────────────────────────────────────────────────────────
    //  GET RESULT
    // ─────────────────────────────────────────────────────────────────

    @GetMapping("/api/attempts/{id}/result")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<QuizResultResponse>> getResult(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {

        User user = resolveUser(principal);
        QuizResultResponse result = quizAttemptService.getResult(id, user);
        return ResponseEntity.ok(ApiResponse.success("Result scorecard retrieved", result));
    }

    // ─────────────────────────────────────────────────────────────────
    //  MY ATTEMPTS
    // ─────────────────────────────────────────────────────────────────

    @GetMapping("/api/attempts/my")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<QuizResultResponse>>> getMyAttempts(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        User user = resolveUser(principal);
        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, Math.min(size, 100), sort);

        Page<QuizResultResponse> history = quizAttemptService.getMyAttempts(user, pageable);
        return ResponseEntity.ok(ApiResponse.success("Attempt history retrieved", history));
    }

    // ─────────────────────────────────────────────────────────────────
    //  HELPERS
    // ─────────────────────────────────────────────────────────────────

    private User resolveUser(UserPrincipal principal) {
        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private String getIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        return (ip == null || ip.isBlank()) ? request.getRemoteAddr() : ip.split(",")[0].trim();
    }

    private String getUa(HttpServletRequest request) {
        return request.getHeader("User-Agent");
    }
}
