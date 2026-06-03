package com.mindrift.ai.controller;

import com.mindrift.ai.dto.*;
import com.mindrift.ai.service.AIService;
import com.mindrift.common.exception.ResourceNotFoundException;
import com.mindrift.common.response.ApiResponse;
import com.mindrift.common.security.UserPrincipal;
import com.mindrift.user.entity.User;
import com.mindrift.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * AI Intelligence Layer REST Controller.
 *
 * POST /api/ai/quizzes/generate       → Generate a quiz with AI
 * POST /api/ai/explain                → Get AI explanation for a question
 * GET  /api/ai/skill-gaps             → Analyse skill gaps from analytics
 * POST /api/ai/learning-path          → Generate personalised learning path
 * POST /api/ai/interview/start        → Start a mock interview session
 * POST /api/ai/interview/{id}/answer  → Submit answer to current question
 * GET  /api/ai/recommendations        → Get personalised quiz recommendations
 * POST /api/ai/recommendations/refresh → Force-refresh recommendations
 */
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Tag(name = "AI Intelligence", description = "AI-powered quiz generation, explanations, learning paths, and recommendations")
public class AIController {

    private final AIService       aiService;
    private final UserRepository  userRepository;

    // ─────────────────────────────────────────────────────────────────────────
    //  QUIZ GENERATION
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/quizzes/generate")
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary     = "Generate AI Quiz",
        description = "Uses AI to generate a complete quiz with questions and answers on any topic. " +
                      "Returns a DRAFT quiz for review before publishing. " +
                      "Defaults to Gemini, falls back to OpenAI → Claude → Mock."
    )
    public ResponseEntity<ApiResponse<GeneratedQuizResponse>> generateQuiz(
            @Valid @RequestBody GenerateQuizRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        User user = resolveUser(principal.getId());
        GeneratedQuizResponse response = aiService.generateQuiz(request, user);
        return ResponseEntity.ok(ApiResponse.success("Quiz generated successfully", response));
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  ANSWER EXPLANATION
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/explain")
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary     = "Explain Answer",
        description = "Generates an AI explanation for a quiz question — why the correct answer is right " +
                      "and why the user's answer (if wrong) was incorrect. Results are cached per question+answer."
    )
    public ResponseEntity<ApiResponse<ExplanationResponse>> explainAnswer(
            @Valid @RequestBody ExplainAnswerRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        User user = resolveUser(principal.getId());
        ExplanationResponse response = aiService.explainAnswer(request, user);
        return ResponseEntity.ok(ApiResponse.success("Explanation generated", response));
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  SKILL GAP ANALYSIS
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/skill-gaps")
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary     = "Analyse Skill Gaps",
        description = "Analyses the authenticated user's quiz history and performance analytics to identify " +
                      "skill gaps and strengths. Returns a personalised report with improvement priorities."
    )
    public ResponseEntity<ApiResponse<SkillGapResponse>> analyseSkillGaps(
            @AuthenticationPrincipal UserPrincipal principal) {

        User user = resolveUser(principal.getId());
        SkillGapResponse response = aiService.analyseSkillGaps(user);
        return ResponseEntity.ok(ApiResponse.success("Skill gap analysis complete", response));
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  LEARNING PATH
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/learning-path")
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary     = "Generate Learning Path",
        description = "Generates a personalised structured learning path targeting identified skill gaps. " +
                      "The path includes ordered milestones with estimated hours and practice topics."
    )
    public ResponseEntity<ApiResponse<LearningPathResponse>> generateLearningPath(
            @Valid @RequestBody LearningPathRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        User user = resolveUser(principal.getId());
        LearningPathResponse response = aiService.generateLearningPath(request, user);
        return ResponseEntity.ok(ApiResponse.success("Learning path generated", response));
    }

    @GetMapping("/learning-paths")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get My Learning Paths")
    public ResponseEntity<ApiResponse<?>> getMyLearningPaths(
            @AuthenticationPrincipal UserPrincipal principal) {
        User user = resolveUser(principal.getId());
        var paths = aiService.getLearningPaths(user.getId());
        return ResponseEntity.ok(ApiResponse.success("Learning paths retrieved", paths));
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  INTERVIEW SIMULATOR
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/interview/start")
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary     = "Start Interview Session",
        description = "Starts an AI-powered mock interview session. Generates the first question immediately. " +
                      "Subsequent turns use POST /interview/{id}/answer."
    )
    public ResponseEntity<ApiResponse<InterviewSessionResponse>> startInterview(
            @Valid @RequestBody StartInterviewRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        User user = resolveUser(principal.getId());
        InterviewSessionResponse response = aiService.startInterview(request, user);
        return ResponseEntity.ok(ApiResponse.success("Interview session started", response));
    }

    @PostMapping("/interview/{sessionId}/answer")
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary     = "Submit Interview Answer",
        description = "Submits the candidate's answer to the current interview question. " +
                      "Returns immediate evaluation feedback and the next question, or final session report if complete."
    )
    public ResponseEntity<ApiResponse<InterviewTurnResponse>> submitAnswer(
            @PathVariable UUID sessionId,
            @RequestParam String answer,
            @AuthenticationPrincipal UserPrincipal principal) {

        User user = resolveUser(principal.getId());
        InterviewTurnResponse response = aiService.submitAnswer(sessionId, answer, user);
        return ResponseEntity.ok(ApiResponse.success("Answer evaluated", response));
    }

    @GetMapping("/interview/history")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get Interview History")
    public ResponseEntity<ApiResponse<?>> getInterviewHistory(
            @AuthenticationPrincipal UserPrincipal principal,
            @org.springdoc.core.annotations.ParameterObject org.springframework.data.domain.Pageable pageable) {
        User user = resolveUser(principal.getId());
        var sessions = aiService.getInterviewHistory(user.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success("Interview history retrieved", sessions));
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  RECOMMENDATIONS
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/recommendations")
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary     = "Get Recommendations",
        description = "Returns personalised quiz recommendations based on the user's performance analytics and skill profile. " +
                      "Results are cached for 24 hours. Use /refresh to force a new generation."
    )
    public ResponseEntity<ApiResponse<RecommendationResponse>> getRecommendations(
            @AuthenticationPrincipal UserPrincipal principal) {

        User user = resolveUser(principal.getId());
        RecommendationResponse response = aiService.getRecommendations(user);
        return ResponseEntity.ok(ApiResponse.success("Recommendations retrieved", response));
    }

    @PostMapping("/recommendations/refresh")
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary     = "Refresh Recommendations",
        description = "Forces regeneration of personalised recommendations, bypassing the cache."
    )
    public ResponseEntity<ApiResponse<RecommendationResponse>> refreshRecommendations(
            @AuthenticationPrincipal UserPrincipal principal) {

        User user = resolveUser(principal.getId());
        RecommendationResponse response = aiService.generateRecommendations(user);
        return ResponseEntity.ok(ApiResponse.success("Recommendations refreshed", response));
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  ADMIN
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/admin/usage")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    @Operation(summary = "AI Usage Stats (Admin)")
    public ResponseEntity<ApiResponse<?>> getUsageStats(
            @AuthenticationPrincipal UserPrincipal principal) {
        var stats = aiService.getUsageStats();
        return ResponseEntity.ok(ApiResponse.success("AI usage stats", stats));
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private User resolveUser(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }
}
