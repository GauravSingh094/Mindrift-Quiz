package com.mindrift.quiz.controller;

import com.mindrift.common.response.ApiResponse;
import com.mindrift.common.security.RequirePermission;
import com.mindrift.common.security.UserPrincipal;
import com.mindrift.quiz.dto.*;
import com.mindrift.quiz.entity.QuizDifficulty;
import com.mindrift.quiz.entity.QuizStatus;
import com.mindrift.quiz.entity.QuizVisibility;
import com.mindrift.quiz.service.QuizService;
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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Quiz Management REST Controller — /api/quizzes
 *
 * POST   /api/quizzes                      → Create quiz (DRAFT)
 * GET    /api/quizzes                      → Search/list quizzes (paginated)
 * GET    /api/quizzes/{id}                 → Get quiz by ID (with questions)
 * PUT    /api/quizzes/{id}                 → Update quiz metadata
 * DELETE /api/quizzes/{id}                 → Soft-delete quiz
 * POST   /api/quizzes/{id}/publish         → Publish quiz (with version snapshot)
 * POST   /api/quizzes/{id}/archive         → Archive quiz
 * POST   /api/quizzes/{id}/clone           → Clone quiz as DRAFT
 * POST   /api/quizzes/{id}/questions/bulk  → Set questions in bulk
 * POST   /api/quizzes/{id}/questions       → Add single question
 * DELETE /api/quizzes/{id}/questions/{qid} → Remove a question
 * GET    /api/quizzes/{id}/versions        → Version history
 * GET    /api/quizzes/{id}/versions/{v}    → Specific version snapshot
 */
@Slf4j
@RestController
@RequestMapping("/api/quizzes")
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;
    private final UserRepository userRepository;

    // ─────────────────────────────────────────────────────────────────
    //  CREATE
    // ─────────────────────────────────────────────────────────────────

    @PostMapping
    @RequirePermission("quiz:create")
    public ResponseEntity<ApiResponse<QuizResponse>> createQuiz(
            @Valid @RequestBody CreateQuizRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest http) {

        User creator = resolveUser(principal);
        QuizResponse response = quizService.createQuiz(request, creator, getIp(http), getUa(http));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Quiz created successfully in DRAFT", response));
    }

    // ─────────────────────────────────────────────────────────────────
    //  UPDATE
    // ─────────────────────────────────────────────────────────────────

    @PutMapping("/{id}")
    @RequirePermission("quiz:update")
    public ResponseEntity<ApiResponse<QuizResponse>> updateQuiz(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateQuizRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest http) {

        User editor = resolveUser(principal);
        QuizResponse response = quizService.updateQuiz(id, request, editor, getIp(http), getUa(http));
        return ResponseEntity.ok(ApiResponse.success("Quiz updated successfully", response));
    }

    // ─────────────────────────────────────────────────────────────────
    //  SOFT DELETE
    // ─────────────────────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    @RequirePermission("quiz:delete")
    public ResponseEntity<ApiResponse<Void>> deleteQuiz(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest http) {

        User actor = resolveUser(principal);
        quizService.deleteQuiz(id, actor, getIp(http), getUa(http));
        return ResponseEntity.ok(ApiResponse.success("Quiz deleted successfully"));
    }

    // ─────────────────────────────────────────────────────────────────
    //  GET BY ID
    // ─────────────────────────────────────────────────────────────────

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<QuizResponse>> getQuizById(@PathVariable UUID id) {
        QuizResponse response = quizService.getQuizById(id);
        return ResponseEntity.ok(ApiResponse.success("Quiz retrieved successfully", response));
    }

    // ─────────────────────────────────────────────────────────────────
    //  SEARCH / LIST
    // ─────────────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<ApiResponse<Page<QuizResponse>>> searchQuizzes(
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) QuizDifficulty difficulty,
            @RequestParam(required = false) QuizStatus status,
            @RequestParam(required = false) QuizVisibility visibility,
            @RequestParam(required = false) UUID creatorId,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, Math.min(size, 100), sort);

        Page<QuizResponse> results = quizService.searchQuizzes(
                categoryId, difficulty, status, visibility, creatorId, tag, search, pageable);
        return ResponseEntity.ok(ApiResponse.success("Quizzes retrieved", results));
    }

    // ─────────────────────────────────────────────────────────────────
    //  PUBLISH
    // ─────────────────────────────────────────────────────────────────

    @PostMapping("/{id}/publish")
    @RequirePermission("quiz:publish")
    public ResponseEntity<ApiResponse<QuizResponse>> publishQuiz(
            @PathVariable UUID id,
            @RequestBody(required = false) PublishQuizRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest http) {

        User actor = resolveUser(principal);
        if (request == null) request = new PublishQuizRequest();
        QuizResponse response = quizService.publishQuiz(id, request, actor, getIp(http), getUa(http));
        return ResponseEntity.ok(ApiResponse.success("Quiz published successfully", response));
    }

    // ─────────────────────────────────────────────────────────────────
    //  ARCHIVE
    // ─────────────────────────────────────────────────────────────────

    @PostMapping("/{id}/archive")
    @RequirePermission("quiz:update")
    public ResponseEntity<ApiResponse<QuizResponse>> archiveQuiz(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest http) {

        User actor = resolveUser(principal);
        QuizResponse response = quizService.archiveQuiz(id, actor, getIp(http), getUa(http));
        return ResponseEntity.ok(ApiResponse.success("Quiz archived successfully", response));
    }

    // ─────────────────────────────────────────────────────────────────
    //  CLONE
    // ─────────────────────────────────────────────────────────────────

    @PostMapping("/{id}/clone")
    @RequirePermission("quiz:create")
    public ResponseEntity<ApiResponse<QuizResponse>> cloneQuiz(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest http) {

        User cloner = resolveUser(principal);
        QuizResponse response = quizService.cloneQuiz(id, cloner, getIp(http), getUa(http));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Quiz cloned as new DRAFT", response));
    }

    // ─────────────────────────────────────────────────────────────────
    //  QUESTIONS — BULK
    // ─────────────────────────────────────────────────────────────────

    @PostMapping("/{id}/questions/bulk")
    @RequirePermission("quiz:update")
    public ResponseEntity<ApiResponse<QuizResponse>> bulkSetQuestions(
            @PathVariable UUID id,
            @Valid @RequestBody BulkQuestionsRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest http) {

        User editor = resolveUser(principal);
        QuizResponse response = quizService.bulkAddQuestions(id, request, editor, getIp(http), getUa(http));
        return ResponseEntity.ok(ApiResponse.success("Questions set successfully", response));
    }

    // ─────────────────────────────────────────────────────────────────
    //  QUESTIONS — ADD SINGLE
    // ─────────────────────────────────────────────────────────────────

    @PostMapping("/{id}/questions")
    @RequirePermission("quiz:update")
    public ResponseEntity<ApiResponse<QuizResponse>> addQuestion(
            @PathVariable UUID id,
            @Valid @RequestBody AddQuestionRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest http) {

        User editor = resolveUser(principal);
        QuizResponse response = quizService.addQuestion(id, request, editor, getIp(http), getUa(http));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Question added successfully", response));
    }

    // ─────────────────────────────────────────────────────────────────
    //  QUESTIONS — REMOVE
    // ─────────────────────────────────────────────────────────────────

    @DeleteMapping("/{id}/questions/{questionId}")
    @RequirePermission("quiz:update")
    public ResponseEntity<ApiResponse<QuizResponse>> removeQuestion(
            @PathVariable UUID id,
            @PathVariable UUID questionId,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest http) {

        User editor = resolveUser(principal);
        QuizResponse response = quizService.removeQuestion(id, questionId, editor, getIp(http), getUa(http));
        return ResponseEntity.ok(ApiResponse.success("Question removed successfully", response));
    }

    // ─────────────────────────────────────────────────────────────────
    //  VERSION HISTORY
    // ─────────────────────────────────────────────────────────────────

    @GetMapping("/{id}/versions")
    public ResponseEntity<ApiResponse<List<QuizVersionResponse>>> getVersionHistory(
            @PathVariable UUID id) {
        List<QuizVersionResponse> versions = quizService.getVersionHistory(id);
        return ResponseEntity.ok(ApiResponse.success("Version history retrieved", versions));
    }

    @GetMapping("/{id}/versions/{version}")
    public ResponseEntity<ApiResponse<QuizVersionResponse>> getSpecificVersion(
            @PathVariable UUID id,
            @PathVariable Integer version) {
        QuizVersionResponse qv = quizService.getSpecificVersion(id, version);
        return ResponseEntity.ok(ApiResponse.success("Version snapshot retrieved", qv));
    }

    // ─────────────────────────────────────────────────────────────────
    //  HELPERS
    // ─────────────────────────────────────────────────────────────────

    private User resolveUser(UserPrincipal principal) {
        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new com.mindrift.common.exception.ResourceNotFoundException("User not found"));
    }

    private String getIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        return (ip == null || ip.isBlank()) ? request.getRemoteAddr() : ip.split(",")[0].trim();
    }

    private String getUa(HttpServletRequest request) {
        return request.getHeader("User-Agent");
    }
}
