package com.mindrift.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindrift.ai.dto.*;
import com.mindrift.ai.entity.*;
import com.mindrift.ai.provider.*;
import com.mindrift.ai.repository.*;
import com.mindrift.analytics.repository.UserAnalyticsRepository;
import com.mindrift.analytics.repository.SkillAnalyticsRepository;
import com.mindrift.common.exception.ResourceNotFoundException;
import com.mindrift.quiz.repository.QuizRepository;
import com.mindrift.user.entity.User;
import com.mindrift.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Core AI Intelligence Service.
 *
 * All features route through here:
 *   - Quiz & Question Generation
 *   - Answer Explanations
 *   - Skill Gap Analysis
 *   - Learning Path Generation
 *   - Interview Simulator
 *   - Smart Recommendations
 *
 * Pattern: every public method saves an AIRequest before calling the provider,
 * saves the AIResponse after, then persists domain objects (GeneratedQuiz etc.)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AIService {

    private static final String AI_JOB_TOPIC = "ai-events";
    private static final int    TOKEN_DAILY_LIMIT = 100_000;

    private final AIRequestRepository       aiRequestRepo;
    private final AIResponseRepository      aiResponseRepo;
    private final GeneratedQuizRepository   generatedQuizRepo;
    private final LearningPathRepository    learningPathRepo;
    private final InterviewSessionRepository sessionRepo;
    private final RecommendationRepository  recommendationRepo;
    private final UserAnalyticsRepository   userAnalyticsRepo;
    private final SkillAnalyticsRepository  skillAnalyticsRepo;
    private final QuizRepository            quizRepository;
    private final UserRepository            userRepository;
    private final AIProviderRouter          router;
    private final PromptTemplateService     prompts;
    private final ObjectMapper              objectMapper;
    private final KafkaTemplate<String, String> kafkaTemplate;

    // ─────────────────────────────────────────────────────────────────────────
    //  QUIZ GENERATION
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public GeneratedQuizResponse generateQuiz(GenerateQuizRequest request, User user) {
        checkTokenQuota(user.getId());

        // Create audit record
        AIRequest aiRequest = createAIRequest(user, AIRequestType.QUIZ_GENERATION,
                PromptTemplateService.SYSTEM_QUIZ_GENERATOR,
                prompts.quizGenerationPrompt(
                        request.getTopic(), request.getCategory(),
                        request.getDifficulty(), request.getQuestionCount(),
                        request.getLanguage() != null ? request.getLanguage() : "English"),
                0.7, 4096);

        // Create GeneratedQuiz placeholder
        GeneratedQuiz gq = new GeneratedQuiz();
        gq.setUser(user);
        gq.setAiRequest(aiRequest);
        gq.setTopic(request.getTopic());
        gq.setCategoryName(request.getCategory());
        gq.setDifficulty(request.getDifficulty());
        gq.setRequestedQuestionCount(request.getQuestionCount());
        gq.setStatus("GENERATING");
        gq = generatedQuizRepo.save(gq);

        try {
            AIProviderResponse providerResp = callProvider(aiRequest);

            // Parse quiz JSON
            JsonNode quizNode = parseJson(providerResp.getRawText());

            gq.setGeneratedTitle(quizNode.path("title").asText("Generated Quiz"));
            gq.setGeneratedDescription(quizNode.path("description").asText());
            gq.setQuizJson(providerResp.getRawText());
            gq.setGeneratedQuestionCount(
                    quizNode.path("questions").size());
            gq.setStatus("DRAFT");

            gq = generatedQuizRepo.save(gq);

            // Save response
            saveAIResponse(aiRequest, user, providerResp, gq.getId(), "GENERATED_QUIZ");
            completeAIRequest(aiRequest, providerResp);

            log.info("Quiz generated: id={} title='{}' questions={}",
                    gq.getId(), gq.getGeneratedTitle(), gq.getGeneratedQuestionCount());

            publishAIEvent("QUIZ_GENERATED", user.getId().toString(),
                    Map.of("generatedQuizId", gq.getId().toString()));

            return toGeneratedQuizResponse(gq);

        } catch (Exception ex) {
            gq.setStatus("FAILED");
            generatedQuizRepo.save(gq);
            failAIRequest(aiRequest, ex.getMessage());
            throw new RuntimeException("Quiz generation failed: " + ex.getMessage(), ex);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  ANSWER EXPLANATION
    // ─────────────────────────────────────────────────────────────────────────

    @Cacheable(cacheNames = "ai-explanations", key = "#request.questionId + '-' + #request.userAnswerIndex")
    @Transactional
    public ExplanationResponse explainAnswer(ExplainAnswerRequest request, User user) {
        AIRequest aiRequest = createAIRequest(user, AIRequestType.ANSWER_EXPLANATION,
                PromptTemplateService.SYSTEM_EXPLAINER,
                prompts.answerExplanationPrompt(
                        request.getQuestionText(), request.getCorrectAnswer(),
                        request.getUserAnswer(), request.getContext()),
                0.5, 1024);

        AIProviderResponse resp = callProvider(aiRequest);
        saveAIResponse(aiRequest, user, resp, null, null);
        completeAIRequest(aiRequest, resp);

        try {
            JsonNode node = parseJson(resp.getRawText());
            return ExplanationResponse.builder()
                    .explanation(node.path("explanation").asText())
                    .whyUserWasWrong(nullableText(node, "whyUserWasWrong"))
                    .conceptSummary(node.path("conceptSummary").asText())
                    .keyPoints(jsonArrayToList(node.path("keyPoints")))
                    .analogy(nullableText(node, "analogy"))
                    .furtherReading(jsonArrayToList(node.path("furtherReading")))
                    .provider(resp.getProvider().name())
                    .build();
        } catch (Exception e) {
            return ExplanationResponse.builder()
                    .explanation(resp.getRawText())
                    .provider(resp.getProvider().name())
                    .build();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  SKILL GAP ANALYSIS
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public SkillGapResponse analyseSkillGaps(User user) {
        // Build analytics context
        var userAnalytics = userAnalyticsRepo.findByUserId(user.getId()).orElse(null);
        var skills = skillAnalyticsRepo.findByUserIdOrderByMasteryScoreDesc(user.getId());

        String analyticsJson = buildAnalyticsContext(userAnalytics, skills);

        AIRequest aiRequest = createAIRequest(user, AIRequestType.SKILL_GAP_ANALYSIS,
                PromptTemplateService.SYSTEM_ANALYST,
                prompts.skillGapAnalysisPrompt(analyticsJson),
                0.4, 2048);

        AIProviderResponse resp = callProvider(aiRequest);
        saveAIResponse(aiRequest, user, resp, null, null);
        completeAIRequest(aiRequest, resp);

        try {
            JsonNode node = parseJson(resp.getRawText());
            return SkillGapResponse.builder()
                    .overallLevel(node.path("overallLevel").asText("INTERMEDIATE"))
                    .strengths(jsonArrayToList(node.path("strengths")))
                    .gaps(parseGaps(node.path("gaps")))
                    .summary(node.path("summary").asText())
                    .recommendedNextStep(node.path("recommendedNextStep").asText())
                    .provider(resp.getProvider().name())
                    .build();
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse skill gap analysis: " + e.getMessage(), e);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  LEARNING PATH
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public LearningPathResponse generateLearningPath(LearningPathRequest request, User user) {
        checkTokenQuota(user.getId());

        AIRequest aiRequest = createAIRequest(user, AIRequestType.LEARNING_PATH_GENERATION,
                PromptTemplateService.SYSTEM_ANALYST,
                prompts.learningPathPrompt(
                        request.getSkillGapsJson(), request.getTargetSkill(),
                        request.getCurrentLevel(), request.getWeeksDuration()),
                0.6, 3000);

        AIProviderResponse resp = callProvider(aiRequest);

        try {
            JsonNode node = parseJson(resp.getRawText());

            LearningPath lp = new LearningPath();
            lp.setUser(user);
            lp.setAiRequest(aiRequest);
            lp.setTitle(node.path("title").asText("Your Learning Path"));
            lp.setDescription(node.path("description").asText());
            lp.setTargetSkill(request.getTargetSkill());
            lp.setEstimatedHours(node.path("estimatedHours").asInt(20));
            lp.setDifficulty(node.path("difficulty").asText("INTERMEDIATE"));
            lp.setMilestonesJson(node.path("milestones").toString());
            lp.setTotalMilestones(node.path("milestones").size());
            lp.setStartedAt(Instant.now());
            lp = learningPathRepo.save(lp);

            saveAIResponse(aiRequest, user, resp, lp.getId(), "LEARNING_PATH");
            completeAIRequest(aiRequest, resp);

            publishAIEvent("LEARNING_PATH_CREATED", user.getId().toString(),
                    Map.of("learningPathId", lp.getId().toString()));

            return toLearningPathResponse(lp);

        } catch (Exception e) {
            failAIRequest(aiRequest, e.getMessage());
            throw new RuntimeException("Learning path generation failed: " + e.getMessage(), e);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  INTERVIEW SIMULATOR
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public InterviewSessionResponse startInterview(StartInterviewRequest request, User user) {
        InterviewSession session = new InterviewSession();
        session.setUser(user);
        session.setTopic(request.getTopic());
        session.setRoleTitle(request.getRoleTitle());
        session.setExperienceLevel(request.getExperienceLevel());
        session.setFocusAreasJson(toJson(request.getFocusAreas()));
        session.setTotalQuestions(request.getTotalQuestions() != null ? request.getTotalQuestions() : 10);
        session.setStartedAt(Instant.now());
        session.setStatus("ACTIVE");

        session = sessionRepo.save(session);

        // Generate first question immediately
        InterviewTurnResponse firstQuestion = generateNextQuestion(session, user);

        return InterviewSessionResponse.builder()
                .sessionId(session.getId())
                .topic(session.getTopic())
                .roleTitle(session.getRoleTitle())
                .experienceLevel(session.getExperienceLevel())
                .totalQuestions(session.getTotalQuestions())
                .currentQuestion(1)
                .status("ACTIVE")
                .firstQuestion(firstQuestion)
                .startedAt(session.getStartedAt())
                .build();
    }

    @Transactional
    public InterviewTurnResponse submitAnswer(UUID sessionId, String userAnswer, User user) {
        InterviewSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + sessionId));

        if (!"ACTIVE".equals(session.getStatus())) {
            throw new IllegalStateException("Session is not active");
        }

        // Get current question from conversation
        JsonNode conversation = parseJson(session.getConversationJson());
        String lastQuestion = extractLastQuestion(conversation);

        // Evaluate the answer
        AIRequest evalRequest = createAIRequest(user, AIRequestType.INTERVIEW_EVALUATION,
                PromptTemplateService.SYSTEM_INTERVIEW,
                prompts.interviewEvaluationPrompt(lastQuestion, userAnswer, "[]"),
                0.3, 1024);

        AIProviderResponse evalResp = callProvider(evalRequest);
        saveAIResponse(evalRequest, user, evalResp, sessionId, "INTERVIEW_SESSION");
        completeAIRequest(evalRequest, evalResp);

        JsonNode evalNode = parseJson(evalResp.getRawText());

        // Append to conversation
        appendToConversation(session, "candidate", userAnswer, null);
        appendToConversation(session, "evaluation", evalResp.getRawText(), evalNode);

        session.setQuestionsAnswered(session.getQuestionsAnswered() + 1);

        // Check if session is done
        if (session.getQuestionsAnswered() >= session.getTotalQuestions()) {
            return finaliseInterview(session, user);
        }

        // Generate next question
        session = sessionRepo.save(session);
        return generateNextQuestion(session, user);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  RECOMMENDATIONS
    // ─────────────────────────────────────────────────────────────────────────

    @Cacheable(cacheNames = "ai-recommendations", key = "#user.id")
    @Transactional
    public RecommendationResponse getRecommendations(User user) {
        // Check for fresh cached recommendation
        List<Recommendation> active = recommendationRepo.findActiveByUserId(
                user.getId(), Instant.now());
        if (!active.isEmpty()) {
            return toRecommendationResponse(active.get(0));
        }

        return generateRecommendations(user);
    }

    @CacheEvict(cacheNames = "ai-recommendations", key = "#user.id")
    @Transactional
    public RecommendationResponse generateRecommendations(User user) {
        var userAnalytics = userAnalyticsRepo.findByUserId(user.getId()).orElse(null);
        var skills = skillAnalyticsRepo.findByUserIdOrderByMasteryScoreDesc(user.getId());
        String analyticsJson = buildAnalyticsContext(userAnalytics, skills);

        // Fetch top 20 available quizzes as candidates
        String quizzesJson = buildQuizCandidatesJson();

        AIRequest aiRequest = createAIRequest(user, AIRequestType.QUIZ_RECOMMENDATION,
                PromptTemplateService.SYSTEM_ANALYST,
                prompts.recommendationPrompt(analyticsJson, quizzesJson),
                0.5, 2048);

        AIProviderResponse resp = callProvider(aiRequest);
        saveAIResponse(aiRequest, user, resp, null, null);
        completeAIRequest(aiRequest, resp);

        try {
            JsonNode node = parseJson(resp.getRawText());

            Recommendation rec = new Recommendation();
            rec.setUser(user);
            rec.setAiRequest(aiRequest);
            rec.setRecommendationType("QUIZ");
            rec.setItemsJson(node.path("items").toString());
            rec.setItemCount(node.path("items").size());
            rec.setRationale(node.path("rationale").asText());
            rec.setAnalyticsSnapshotJson(analyticsJson);
            rec.setExpiresAt(Instant.now().plus(24, ChronoUnit.HOURS));
            rec = recommendationRepo.save(rec);

            return toRecommendationResponse(rec);

        } catch (Exception e) {
            failAIRequest(aiRequest, e.getMessage());
            throw new RuntimeException("Recommendation generation failed: " + e.getMessage(), e);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  PRIVATE: Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private InterviewTurnResponse generateNextQuestion(InterviewSession session, User user) {
        AIRequest qRequest = createAIRequest(user, AIRequestType.INTERVIEW_QUESTION,
                PromptTemplateService.SYSTEM_INTERVIEW,
                prompts.interviewQuestionPrompt(
                        session.getTopic(), session.getRoleTitle(),
                        session.getExperienceLevel(), session.getConversationJson()),
                0.8, 512);

        AIProviderResponse qResp = callProvider(qRequest);
        saveAIResponse(qRequest, user, qResp, session.getId(), "INTERVIEW_SESSION");
        completeAIRequest(qRequest, qResp);

        JsonNode qNode = parseJson(qResp.getRawText());
        String question = qNode.path("question").asText();

        session.setCurrentQuestion(session.getCurrentQuestion() + 1);
        appendToConversation(session, "interviewer", question, qNode);
        sessionRepo.save(session);

        return InterviewTurnResponse.builder()
                .sessionId(session.getId())
                .questionNumber(session.getCurrentQuestion())
                .question(question)
                .difficulty(qNode.path("difficulty").asText("MEDIUM"))
                .estimatedMinutes(qNode.path("estimatedMinutes").asInt(5))
                .isLastQuestion(session.getCurrentQuestion() >= session.getTotalQuestions())
                .build();
    }

    private InterviewTurnResponse finaliseInterview(InterviewSession session, User user) {
        AIRequest fbRequest = createAIRequest(user, AIRequestType.INTERVIEW_FEEDBACK,
                PromptTemplateService.SYSTEM_INTERVIEW,
                prompts.interviewFeedbackPrompt(
                        session.getConversationJson(), session.getRoleTitle()),
                0.4, 2048);

        AIProviderResponse fbResp = callProvider(fbRequest);
        completeAIRequest(fbRequest, fbResp);

        JsonNode fbNode = parseJson(fbResp.getRawText());

        session.setStatus("COMPLETED");
        session.setCompletedAt(Instant.now());
        session.setOverallScore(fbNode.path("overallScore").asDouble());
        session.setTechnicalScore(fbNode.path("technicalScore").asDouble());
        session.setCommunicationScore(fbNode.path("communicationScore").asDouble());
        session.setProblemSolvingScore(fbNode.path("problemSolvingScore").asDouble());
        session.setFinalFeedback(fbNode.path("summary").asText());
        session.setStrengthsJson(fbNode.path("strengths").toString());
        session.setImprovementsJson(fbNode.path("improvements").toString());
        sessionRepo.save(session);

        publishAIEvent("INTERVIEW_COMPLETED", user.getId().toString(),
                Map.of("sessionId", session.getId().toString(),
                        "score", String.valueOf(session.getOverallScore())));

        return InterviewTurnResponse.builder()
                .sessionId(session.getId())
                .sessionCompleted(true)
                .overallScore(session.getOverallScore())
                .finalFeedback(session.getFinalFeedback())
                .strengths(jsonArrayToList(fbNode.path("strengths")))
                .improvements(jsonArrayToList(fbNode.path("improvements")))
                .readinessLevel(fbNode.path("readinessLevel").asText())
                .build();
    }

    private AIProviderResponse callProvider(AIRequest aiRequest) {
        AIProviderRequest providerRequest = AIProviderRequest.builder()
                .requestType(aiRequest.getRequestType())
                .systemPrompt(aiRequest.getSystemPrompt())
                .userPrompt(aiRequest.getUserPrompt())
                .temperature(aiRequest.getTemperature())
                .maxTokens(aiRequest.getMaxTokens())
                .build();

        aiRequest.setStatus("PROCESSING");
        aiRequest.setStartedAt(Instant.now());
        aiRequestRepo.save(aiRequest);

        return router.route(providerRequest);
    }

    private AIRequest createAIRequest(User user, AIRequestType type,
                                       String systemPrompt, String userPrompt,
                                       double temperature, int maxTokens) {
        AIRequest req = new AIRequest();
        req.setUser(user);
        req.setRequestType(type);
        req.setProvider(AIProvider.GEMINI); // default, updated after routing
        req.setSystemPrompt(systemPrompt);
        req.setUserPrompt(userPrompt);
        req.setTemperature(temperature);
        req.setMaxTokens(maxTokens);
        req.setPromptHash(sha256(systemPrompt + userPrompt));
        req.setJobId(UUID.randomUUID().toString().substring(0, 8));
        return aiRequestRepo.save(req);
    }

    private void completeAIRequest(AIRequest req, AIProviderResponse resp) {
        req.setStatus("COMPLETED");
        req.setProvider(resp.getProvider());
        req.setModelId(resp.getModelUsed());
        req.setPromptTokens(resp.getPromptTokens());
        req.setCompletionTokens(resp.getCompletionTokens());
        req.setTotalTokens(resp.getTotalTokens());
        req.setLatencyMs(resp.getLatencyMs());
        req.setCompletedAt(Instant.now());
        aiRequestRepo.save(req);
    }

    private void failAIRequest(AIRequest req, String error) {
        req.setStatus("FAILED");
        req.setErrorMessage(error);
        req.setCompletedAt(Instant.now());
        aiRequestRepo.save(req);
    }

    private void saveAIResponse(AIRequest req, User user, AIProviderResponse resp,
                                 UUID entityId, String entityType) {
        AIResponse response = new AIResponse();
        response.setRequest(req);
        response.setUser(user);
        response.setRawResponse(resp.getRawText());
        response.setParsedJson(resp.getRawText());
        response.setGeneratedEntityId(entityId);
        response.setGeneratedEntityType(entityType);
        aiResponseRepo.save(response);
    }

    private void checkTokenQuota(UUID userId) {
        Instant dayAgo = Instant.now().minus(24, ChronoUnit.HOURS);
        long used = aiRequestRepo.sumTokensForUser(userId, dayAgo);
        if (used >= TOKEN_DAILY_LIMIT) {
            throw new IllegalStateException(
                    "Daily AI token quota exceeded (" + TOKEN_DAILY_LIMIT + " tokens/day)");
        }
    }

    private String buildAnalyticsContext(
            com.mindrift.analytics.entity.UserAnalytics ua,
            java.util.List<com.mindrift.analytics.entity.SkillAnalytics> skills) {
        Map<String, Object> ctx = new LinkedHashMap<>();
        if (ua != null) {
            ctx.put("totalAttempts",     ua.getTotalAttempts());
            ctx.put("passRate",          ua.getSubmittedAttempts() > 0
                    ? (double) ua.getPassedAttempts() / ua.getSubmittedAttempts() * 100 : 0);
            ctx.put("averageScore",      ua.getAverageScore());
            ctx.put("accuracyRate",      ua.getAccuracyRate());
            ctx.put("streakDays",        ua.getCurrentStreakDays());
        }
        if (!skills.isEmpty()) {
            ctx.put("skills", skills.stream().map(s -> Map.of(
                    "category",   s.getCategoryName() != null ? s.getCategoryName() : "Unknown",
                    "mastery",    s.getMasteryScore(),
                    "level",      s.getSkillLevel(),
                    "trend",      s.getTrend()
            )).collect(Collectors.toList()));
        }
        return toJson(ctx);
    }

    private String buildQuizCandidatesJson() {
        try {
            var quizzes = quizRepository.findAll(
                    org.springframework.data.domain.PageRequest.of(0, 20));
            var list = quizzes.getContent().stream().map(q -> Map.of(
                    "id",         q.getId().toString(),
                    "title",      q.getTitle(),
                    "category",   q.getCategory() != null ? q.getCategory().getName() : "General",
                    "difficulty", q.getDifficulty().name()
            )).collect(Collectors.toList());
            return toJson(list);
        } catch (Exception e) { return "[]"; }
    }

    private void appendToConversation(InterviewSession session, String role,
                                       String content, JsonNode metadata) {
        try {
            com.fasterxml.jackson.databind.node.ArrayNode arr =
                    (com.fasterxml.jackson.databind.node.ArrayNode)
                    objectMapper.readTree(session.getConversationJson());
            com.fasterxml.jackson.databind.node.ObjectNode turn = objectMapper.createObjectNode();
            turn.put("role",      role);
            turn.put("content",   content);
            turn.put("timestamp", Instant.now().toString());
            if (metadata != null && metadata.has("score")) {
                turn.put("score", metadata.path("score").asInt());
            }
            arr.add(turn);
            session.setConversationJson(arr.toString());
        } catch (Exception ignored) {}
    }

    private String extractLastQuestion(JsonNode conversation) {
        if (!conversation.isArray() || conversation.isEmpty()) return "";
        for (int i = conversation.size() - 1; i >= 0; i--) {
            JsonNode turn = conversation.get(i);
            if ("interviewer".equals(turn.path("role").asText())) {
                return turn.path("content").asText();
            }
        }
        return "";
    }

    private List<SkillGapResponse.GapDto> parseGaps(JsonNode gapsNode) {
        List<SkillGapResponse.GapDto> gaps = new ArrayList<>();
        if (gapsNode.isArray()) {
            gapsNode.forEach(g -> gaps.add(SkillGapResponse.GapDto.builder()
                    .category(g.path("category").asText())
                    .currentLevel(g.path("currentLevel").asDouble())
                    .targetLevel(g.path("targetLevel").asDouble())
                    .priority(g.path("priority").asText())
                    .recommendedFocusAreas(jsonArrayToList(g.path("recommendedFocusAreas")))
                    .build()));
        }
        return gaps;
    }

    private JsonNode parseJson(String raw) {
        try {
            // Strip markdown code blocks if present
            String cleaned = raw.trim();
            if (cleaned.startsWith("```")) {
                cleaned = cleaned.replaceAll("^```[a-z]*\\n?", "").replaceAll("```$", "").trim();
            }
            return objectMapper.readTree(cleaned);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse AI JSON response: " + raw, e);
        }
    }

    private List<String> jsonArrayToList(JsonNode node) {
        List<String> result = new ArrayList<>();
        if (node != null && node.isArray()) {
            node.forEach(n -> result.add(n.asText()));
        }
        return result;
    }

    private String nullableText(JsonNode node, String field) {
        JsonNode f = node.path(field);
        return f.isNull() || f.isMissingNode() ? null : f.asText();
    }

    private String toJson(Object obj) {
        try { return objectMapper.writeValueAsString(obj); }
        catch (Exception e) { return "{}"; }
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) { return UUID.randomUUID().toString(); }
    }

    @Async
    public void publishAIEvent(String eventType, String userId, Map<String, String> data) {
        try {
            Map<String, Object> event = new LinkedHashMap<>();
            event.put("eventType", eventType);
            event.put("userId", userId);
            event.put("data", data);
            event.put("timestamp", Instant.now().toString());
            kafkaTemplate.send(AI_JOB_TOPIC, userId, toJson(event));
        } catch (Exception e) {
            log.warn("Failed to publish AI event {}: {}", eventType, e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  QUERY METHODS
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<LearningPathResponse> getLearningPaths(UUID userId) {
        return learningPathRepo.findByUserIdAndStatusOrderByCreatedAtDesc(userId, "ACTIVE")
                .stream().map(this::toLearningPathResponse).toList();
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<InterviewSessionSummary> getInterviewHistory(
            UUID userId, org.springframework.data.domain.Pageable pageable) {
        return sessionRepo.findByUserIdOrderByStartedAtDesc(userId, pageable)
                .map(s -> InterviewSessionSummary.builder()
                        .sessionId(s.getId())
                        .topic(s.getTopic())
                        .roleTitle(s.getRoleTitle())
                        .status(s.getStatus())
                        .overallScore(s.getOverallScore())
                        .startedAt(s.getStartedAt())
                        .completedAt(s.getCompletedAt())
                        .build());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getUsageStats() {
        Instant dayAgo = Instant.now().minus(24, ChronoUnit.HOURS);
        List<Object[]> latencies = aiRequestRepo.avgLatencyByProvider(dayAgo);
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalRequests", aiRequestRepo.count());
        stats.put("providerLatencyMs", latencies.stream().map(row ->
                Map.of("provider", row[0].toString(), "avgMs", row[1])
        ).collect(Collectors.toList()));
        return stats;
    }

    private GeneratedQuizResponse toGeneratedQuizResponse(GeneratedQuiz gq) {
        return GeneratedQuizResponse.builder()
                .generatedQuizId(gq.getId())
                .topic(gq.getTopic())
                .title(gq.getGeneratedTitle())
                .description(gq.getGeneratedDescription())
                .category(gq.getCategoryName())
                .difficulty(gq.getDifficulty())
                .questionCount(gq.getGeneratedQuestionCount())
                .status(gq.getStatus())
                .quizJson(gq.getQuizJson())
                .createdAt(gq.getCreatedAt())
                .build();
    }

    private LearningPathResponse toLearningPathResponse(LearningPath lp) {
        List<LearningPathResponse.MilestoneDto> milestones = new ArrayList<>();
        try {
            JsonNode arr = objectMapper.readTree(lp.getMilestonesJson());
            if (arr.isArray()) {
                arr.forEach(m -> milestones.add(LearningPathResponse.MilestoneDto.builder()
                        .milestoneIndex(m.path("milestoneIndex").asInt())
                        .title(m.path("title").asText())
                        .description(m.path("description").asText())
                        .topics(jsonArrayToList(m.path("topics")))
                        .estimatedHours(m.path("estimatedHours").asInt())
                        .build()));
            }
        } catch (Exception ignored) {}

        return LearningPathResponse.builder()
                .learningPathId(lp.getId())
                .title(lp.getTitle())
                .description(lp.getDescription())
                .targetSkill(lp.getTargetSkill())
                .estimatedHours(lp.getEstimatedHours())
                .difficulty(lp.getDifficulty())
                .totalMilestones(lp.getTotalMilestones())
                .milestones(milestones)
                .status(lp.getStatus())
                .progressPercentage(lp.getProgressPercentage())
                .startedAt(lp.getStartedAt())
                .build();
    }

    private RecommendationResponse toRecommendationResponse(Recommendation rec) {
        List<RecommendationResponse.RecommendedItem> items = new ArrayList<>();
        try {
            JsonNode arr = objectMapper.readTree(rec.getItemsJson());
            if (arr.isArray()) {
                arr.forEach(item -> items.add(RecommendationResponse.RecommendedItem.builder()
                        .rank(item.path("rank").asInt())
                        .entityId(nullableText(item, "entityId"))
                        .entityType(item.path("entityType").asText())
                        .title(item.path("title").asText())
                        .reason(item.path("reason").asText())
                        .confidenceScore(item.path("confidenceScore").asDouble())
                        .build()));
            }
        } catch (Exception ignored) {}

        return RecommendationResponse.builder()
                .recommendationId(rec.getId())
                .type(rec.getRecommendationType())
                .rationale(rec.getRationale())
                .items(items)
                .expiresAt(rec.getExpiresAt())
                .generatedAt(rec.getCreatedAt())
                .build();
    }
}
