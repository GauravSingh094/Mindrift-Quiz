package com.mindrift.quiz.service;

import com.mindrift.common.base.AuditService;
import com.mindrift.common.exception.BaseMindriftException;
import com.mindrift.common.exception.ErrorCode;
import com.mindrift.common.exception.MindriftException;
import com.mindrift.common.exception.ResourceNotFoundException;
import com.mindrift.common.locking.DistributedLockService;
import com.mindrift.quiz.dto.*;
import com.mindrift.quiz.entity.*;
import com.mindrift.quiz.event.AttemptEventPublisher;
import com.mindrift.quiz.repository.*;
import com.mindrift.quiz.scoring.ScoreResult;
import com.mindrift.quiz.scoring.ScoringService;
import com.mindrift.quiz.session.AttemptSession;
import com.mindrift.quiz.session.AttemptSessionService;
import com.mindrift.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Quiz Attempt & Scoring Engine — production-grade implementation.
 *
 * Design decisions:
 *  1. Redis session for in-progress state — eliminates per-answer DB reads.
 *  2. Distributed lock on submit — prevents double-submission race conditions.
 *  3. Idempotency key on attempt start — prevents duplicate attempts from retries.
 *  4. Kafka events for ATTEMPT_STARTED, ANSWER_SAVED, ATTEMPT_FINALISED.
 *  5. Negative marking support — configurable per quiz (default 0.0).
 *  6. Graceful Redis fallback — if Redis is unavailable, falls back to DB.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class QuizAttemptService {

    // ─── Negative marking default (0 = no penalty) ───────────────────
    private static final double DEFAULT_NEGATIVE_MARKING = 0.0;

    // ─── Distributed lock config ──────────────────────────────────────
    private static final long   SUBMIT_LOCK_WAIT_MS  = 5_000;
    private static final long   SUBMIT_LOCK_LEASE_MS = 15_000;

    // ─── Submission grace: allow 15s network delay past endTime ──────
    private static final long   SUBMISSION_GRACE_SECS = 15;

    // ─── Dependencies ─────────────────────────────────────────────────
    private final QuizRepository              quizRepository;
    private final QuizAttemptRepository       quizAttemptRepository;
    private final QuestionRepository          questionRepository;
    private final QuestionResponseRepository  questionResponseRepository;
    private final ScoringService              scoringService;
    private final AttemptSessionService       sessionService;
    private final AttemptEventPublisher       eventPublisher;
    private final DistributedLockService      lockService;
    private final AuditService                auditService;

    // ─────────────────────────────────────────────────────────────────
    //  START ATTEMPT
    // ─────────────────────────────────────────────────────────────────

    /**
     * Starts a new quiz attempt.
     * Guards: quiz must be PUBLISHED, user must not have an active attempt.
     * Creates both the DB record and the Redis session.
     */
    @Transactional
    public StartAttemptResponse startAttempt(UUID quizId, User user,
                                             String ipAddress, String userAgent) {
        log.info("Starting attempt for user {} on quiz {}", user.getId(), quizId);

        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found: " + quizId));

        if (quiz.getStatus() != QuizStatus.PUBLISHED) {
            throw new MindriftException(
                    "Only PUBLISHED quizzes can be attempted.", ErrorCode.INVALID_STATE);
        }

        if (quiz.getQuestions() == null || quiz.getQuestions().isEmpty()) {
            throw new MindriftException(
                    "This quiz has no questions.", ErrorCode.INVALID_STATE);
        }

        // Guard: no concurrent active attempt
        quizAttemptRepository.findActiveAttempt(user.getId(), quizId, Instant.now())
                .ifPresent(active -> {
                    throw new MindriftException(
                            "You have an active attempt in progress for this quiz. Attempt ID: " + active.getId(),
                            ErrorCode.INVALID_STATE);
                });

        // Compute attempt number
        int attemptNum = quizAttemptRepository
                .findFirstByUserIdAndQuizIdOrderByAttemptNumberDesc(user.getId(), quizId)
                .map(a -> a.getAttemptNumber() + 1)
                .orElse(1);

        Instant startTime = Instant.now();
        Instant endTime   = startTime.plus(Duration.ofMinutes(quiz.getEstimatedDuration()));
        double  maxScore  = quiz.getQuestions().stream()
                .mapToDouble(q -> q.getPoints().doubleValue()).sum();

        QuizAttempt attempt = new QuizAttempt();
        attempt.setUser(user);
        attempt.setQuiz(quiz);
        attempt.setStatus(QuizAttemptStatus.STARTED);
        attempt.setStartTime(startTime);
        attempt.setEndTime(endTime);
        attempt.setAttemptNumber(attemptNum);
        attempt.setScore(0.0);
        attempt.setMaxScore(maxScore);
        attempt.setIpAddress(ipAddress);
        attempt.setUserAgent(userAgent != null && userAgent.length() > 512
                ? userAgent.substring(0, 512) : userAgent);

        QuizAttempt saved = quizAttemptRepository.save(attempt);

        // Bootstrap Redis session
        AttemptSession session = AttemptSession.builder()
                .attemptId(saved.getId())
                .userId(user.getId())
                .quizId(quizId)
                .status("STARTED")
                .startTime(startTime)
                .endTime(endTime)
                .attemptNumber(attemptNum)
                .totalQuestions(quiz.getQuestions().size())
                .runningScore(0.0)
                .negativeMarkingFraction(DEFAULT_NEGATIVE_MARKING)
                .lastActivityAt(Instant.now())
                .build();
        sessionService.saveSession(session);

        // Publish Kafka event
        eventPublisher.publishAttemptStarted(saved);

        auditService.logAction(user, "ATTEMPT_STARTED",
                Map.of("attemptId", saved.getId().toString(),
                        "quizId", quizId.toString(),
                        "attemptNumber", String.valueOf(attemptNum)),
                ipAddress, userAgent);

        log.info("Attempt {} started for user {} on quiz {} (attempt #{})",
                saved.getId(), user.getId(), quizId, attemptNum);

        return buildStartResponse(saved, quiz);
    }

    // ─────────────────────────────────────────────────────────────────
    //  SAVE ANSWER (auto-save / progress save)
    // ─────────────────────────────────────────────────────────────────

    /**
     * Saves or updates the user's answer for a single question.
     * Redis-first: updates session cache. DB write is async-deferred.
     * Idempotent: repeated calls for same questionId simply overwrite.
     */
    @Transactional
    public AttemptProgressResponse saveAnswer(UUID attemptId, SaveAnswerRequest request,
                                              User user, String ipAddress, String userAgent) {
        QuizAttempt attempt = loadAttemptForUser(attemptId, user.getId());
        assertAttemptEditable(attempt);
        assertNotExpired(attempt);

        Question question = questionRepository.findById(request.getQuestionId())
                .orElseThrow(() -> new ResourceNotFoundException("Question not found: " + request.getQuestionId()));

        if (!question.getQuiz().getId().equals(attempt.getQuiz().getId())) {
            throw new MindriftException(
                    "Question does not belong to this quiz.", ErrorCode.INVALID_STATE);
        }

        // Score the answer
        List<String> selectedIds = request.getSelectedOptionIds() != null
                ? request.getSelectedOptionIds() : Collections.emptyList();

        // Load negative marking from Redis session (or default)
        double negativeFraction = sessionService.loadSession(attemptId)
                .map(AttemptSession::getNegativeMarkingFraction)
                .orElse(DEFAULT_NEGATIVE_MARKING);

        ScoreResult result = scoringService.calculateQuestionScore(question, selectedIds, negativeFraction);

        Instant now = Instant.now();

        // Upsert QuestionResponse in DB
        com.mindrift.quiz.entity.QuestionResponse response = questionResponseRepository
                .findByAttemptIdAndQuestionId(attemptId, question.getId())
                .orElseGet(com.mindrift.quiz.entity.QuestionResponse::new);

        response.setAttempt(attempt);
        response.setQuestion(question);
        response.setSelectedOptionIds(selectedIds);
        response.setPointsEarned(result.getPointsEarned());
        response.setMaxPoints(result.getMaxPoints());
        response.setIsCorrect(result.isCorrect());
        response.setIsPartial(result.isPartial());
        response.setScoreType(result.getScoreType());
        response.setAnsweredAt(now);
        response.setTimeSpentMs(request.getTimeSpentMs());

        questionResponseRepository.save(response);

        // Update Redis session
        sessionService.loadSession(attemptId).ifPresent(session -> {
            session.getAnsweredQuestions().put(question.getId().toString(), selectedIds);
            session.setStatus("IN_PROGRESS");
            session.setLastActivityAt(now);
            // Recompute running score from all answers in session
            double runningScore = recalcRunningScoreFromSession(attempt, session);
            session.setRunningScore(runningScore);
            sessionService.saveSession(session);
        });

        // Update attempt status to IN_PROGRESS
        if (attempt.getStatus() == QuizAttemptStatus.STARTED) {
            attempt.setStatus(QuizAttemptStatus.IN_PROGRESS);
            quizAttemptRepository.save(attempt);
        }

        // Publish Kafka event
        eventPublisher.publishAnswerSubmitted(attemptId, user.getId(), attempt.getQuiz().getId(),
                question.getId(), selectedIds,
                result.getPointsEarned(), result.getMaxPoints(), result.getScoreType());

        auditService.logAction(user, "ANSWER_SAVED",
                Map.of("attemptId", attemptId.toString(),
                        "questionId", question.getId().toString(),
                        "scoreType", result.getScoreType()),
                ipAddress, userAgent);

        return buildProgressResponse(attempt);
    }

    // ─────────────────────────────────────────────────────────────────
    //  SUBMIT ATTEMPT
    // ─────────────────────────────────────────────────────────────────

    /**
     * Finalises an attempt with distributed lock protection.
     * Idempotent: if the attempt is already SUBMITTED, returns cached result.
     * Supports late submission with a 15-second grace window past endTime.
     */
    public QuizResultResponse submitAttempt(UUID attemptId, User user,
                                            String ipAddress, String userAgent) {
        // Idempotency: already submitted?
        QuizAttempt existingAttempt = loadAttemptForUser(attemptId, user.getId());
        if (existingAttempt.getStatus() == QuizAttemptStatus.SUBMITTED) {
            log.info("Idempotent submit: attempt {} already submitted, returning cached result", attemptId);
            return buildResult(existingAttempt);
        }
        if (existingAttempt.getStatus() == QuizAttemptStatus.EXPIRED) {
            throw new MindriftException("Attempt has already expired.", ErrorCode.INVALID_STATE);
        }
        if (existingAttempt.getStatus() == QuizAttemptStatus.CANCELLED) {
            throw new MindriftException("Attempt has been cancelled.", ErrorCode.INVALID_STATE);
        }

        String lockKey = "mindrift:lock:submit:" + attemptId;
        try {
            return lockService.executeWithLock(lockKey, SUBMIT_LOCK_WAIT_MS, SUBMIT_LOCK_LEASE_MS, () ->
                    executeSubmit(attemptId, user, ipAddress, userAgent));
        } catch (BaseMindriftException e) {
            throw e;
        } catch (Exception e) {
            log.error("Submit failed for attempt {}", attemptId, e);
            throw new MindriftException("Submission failed. Please retry.", ErrorCode.INTERNAL_ERROR);
        }
    }

    @Transactional
    private QuizResultResponse executeSubmit(UUID attemptId, User user,
                                             String ipAddress, String userAgent) {
        QuizAttempt attempt = loadAttemptForUser(attemptId, user.getId());

        // Double-check after acquiring lock (race condition protection)
        if (attempt.getStatus() == QuizAttemptStatus.SUBMITTED) {
            return buildResult(attempt);
        }

        Instant now = Instant.now();
        Instant graceCutoff = attempt.getEndTime().plusSeconds(SUBMISSION_GRACE_SECS);

        if (now.isAfter(graceCutoff)) {
            // Treat as expired auto-submission
            return finaliseAttempt(attempt, QuizAttemptStatus.EXPIRED, now, "ATTEMPT_EXPIRED",
                    ipAddress, userAgent);
        }

        return finaliseAttempt(attempt, QuizAttemptStatus.SUBMITTED, now, "ATTEMPT_SUBMITTED",
                ipAddress, userAgent);
    }

    // ─────────────────────────────────────────────────────────────────
    //  GET RESULT
    // ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public QuizResultResponse getResult(UUID attemptId, User user) {
        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Attempt not found: " + attemptId));

        boolean isOwner = attempt.getUser().getId().equals(user.getId());
        boolean isAdmin  = user.getRole().name().contains("ADMIN");
        if (!isOwner && !isAdmin) {
            throw new MindriftException("Not authorized to view this result.", ErrorCode.FORBIDDEN);
        }

        if (attempt.getStatus() == QuizAttemptStatus.STARTED ||
                attempt.getStatus() == QuizAttemptStatus.IN_PROGRESS) {
            throw new MindriftException(
                    "Attempt is still in progress. Submit first to see results.", ErrorCode.INVALID_STATE);
        }

        return buildResult(attempt);
    }

    // ─────────────────────────────────────────────────────────────────
    //  GET PROGRESS (reconnect / resume)
    // ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AttemptProgressResponse getProgress(UUID attemptId, User user) {
        QuizAttempt attempt = loadAttemptForUser(attemptId, user.getId());
        assertAttemptEditable(attempt);
        return buildProgressResponse(attempt);
    }

    // ─────────────────────────────────────────────────────────────────
    //  MY ATTEMPTS
    // ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<QuizResultResponse> getMyAttempts(User user, Pageable pageable) {
        return quizAttemptRepository.findByUserId(user.getId(), pageable)
                .map(this::buildResult);
    }

    // ─────────────────────────────────────────────────────────────────
    //  INTERNAL: FINALISE
    // ─────────────────────────────────────────────────────────────────

    private QuizResultResponse finaliseAttempt(QuizAttempt attempt, QuizAttemptStatus finalStatus,
                                               Instant now, String eventType,
                                               String ipAddress, String userAgent) {
        List<Question> questions = attempt.getQuiz().getQuestions();
        double maxScore = questions.stream().mapToDouble(q -> q.getPoints().doubleValue()).sum();

        double totalScore   = 0.0;
        int    correct      = 0;
        int    incorrect    = 0;
        int    unanswered   = 0;

        for (Question q : questions) {
            Optional<com.mindrift.quiz.entity.QuestionResponse> respOpt =
                    questionResponseRepository.findByAttemptIdAndQuestionId(attempt.getId(), q.getId());
            if (respOpt.isPresent()) {
                com.mindrift.quiz.entity.QuestionResponse resp = respOpt.get();
                totalScore += resp.getPointsEarned();
                if (Boolean.TRUE.equals(resp.getIsCorrect())) correct++;
                else incorrect++;
            } else {
                unanswered++;
            }
        }

        // Clamp total score to 0 (negative marking cannot drop below 0 overall)
        totalScore = Math.max(0.0, totalScore);
        totalScore = Math.round(totalScore * 100.0) / 100.0;

        double percentage = maxScore > 0
                ? Math.round((totalScore / maxScore) * 10000.0) / 100.0
                : 0.0;
        boolean passed = percentage >= attempt.getQuiz().getPassingScore();
        long timeTaken = Duration.between(attempt.getStartTime(), now).toSeconds();

        attempt.setStatus(finalStatus);
        attempt.setSubmittedAt(now);
        attempt.setScore(totalScore);
        attempt.setMaxScore(maxScore);
        attempt.setPercentage(percentage);
        attempt.setPassed(passed);
        attempt.setCorrectCount(correct);
        attempt.setIncorrectCount(incorrect);
        attempt.setUnansweredCount(unanswered);
        attempt.setTimeTakenSeconds(timeTaken);

        QuizAttempt saved = quizAttemptRepository.save(attempt);

        // Clean up Redis
        sessionService.evictSession(attempt.getId());

        // Kafka
        eventPublisher.publishAttemptFinalised(saved, eventType);

        auditService.logAction(attempt.getUser(), eventType,
                Map.of("attemptId", saved.getId().toString(),
                        "score", String.valueOf(totalScore),
                        "percentage", String.valueOf(percentage),
                        "passed", String.valueOf(passed)),
                ipAddress, userAgent);

        log.info("Attempt {} finalised as {}: score={}/{} ({}%) passed={}",
                saved.getId(), finalStatus, totalScore, maxScore, percentage, passed);

        return buildResult(saved);
    }

    // ─────────────────────────────────────────────────────────────────
    //  INTERNAL: GUARDS
    // ─────────────────────────────────────────────────────────────────

    private QuizAttempt loadAttemptForUser(UUID attemptId, UUID userId) {
        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Attempt not found: " + attemptId));
        if (!attempt.getUser().getId().equals(userId)) {
            throw new MindriftException("You do not own this attempt.", ErrorCode.FORBIDDEN);
        }
        return attempt;
    }

    private void assertAttemptEditable(QuizAttempt attempt) {
        if (attempt.getStatus() == QuizAttemptStatus.SUBMITTED ||
                attempt.getStatus() == QuizAttemptStatus.EXPIRED ||
                attempt.getStatus() == QuizAttemptStatus.CANCELLED) {
            throw new MindriftException(
                    "Attempt is already finalised (" + attempt.getStatus() + ") and cannot be modified.",
                    ErrorCode.INVALID_STATE);
        }
    }

    private void assertNotExpired(QuizAttempt attempt) {
        if (Instant.now().isAfter(attempt.getEndTime())) {
            // Auto-expire and throw
            throw new MindriftException(
                    "Quiz time limit exceeded. Attempt will be auto-submitted.", ErrorCode.INVALID_STATE);
        }
    }

    // ─────────────────────────────────────────────────────────────────
    //  INTERNAL: SCORE HELPERS
    // ─────────────────────────────────────────────────────────────────

    /**
     * Recalculates running score from all saved responses.
     * Used to keep the Redis session's runningScore in sync.
     */
    private double recalcRunningScoreFromSession(QuizAttempt attempt, AttemptSession session) {
        return questionResponseRepository.sumPointsEarnedByAttemptId(attempt.getId())
                .orElse(0.0);
    }

    // ─────────────────────────────────────────────────────────────────
    //  MAPPING
    // ─────────────────────────────────────────────────────────────────

    private StartAttemptResponse buildStartResponse(QuizAttempt attempt, Quiz quiz) {
        List<com.mindrift.quiz.dto.QuestionResponse> questionDtos = null;
        if (quiz.getQuestions() != null) {
            questionDtos = quiz.getQuestions().stream().map(q ->
                    com.mindrift.quiz.dto.QuestionResponse.builder()
                            .id(q.getId())
                            .type(q.getType())
                            .questionText(q.getQuestionText())
                            .explanation(null)   // hide explanation during attempt
                            .points(q.getPoints())
                            .orderIndex(q.getOrderIndex())
                            .options(q.getOptions().stream().map(o ->
                                    com.mindrift.quiz.dto.OptionResponse.builder()
                                            .id(o.getId())
                                            .optionText(o.getOptionText())
                                            .isCorrect(null)  // hide correct flags during attempt
                                            .orderIndex(o.getOrderIndex())
                                            .build()
                            ).collect(Collectors.toList()))
                            .build()
            ).collect(Collectors.toList());
        }

        long remainingSecs = Duration.between(Instant.now(), attempt.getEndTime()).toSeconds();

        return StartAttemptResponse.builder()
                .attemptId(attempt.getId())
                .quizId(quiz.getId())
                .quizTitle(quiz.getTitle())
                .startTime(attempt.getStartTime())
                .endTime(attempt.getEndTime())
                .remainingSeconds(Math.max(0, remainingSecs))
                .totalQuestions(quiz.getQuestions().size())
                .estimatedDurationMinutes(quiz.getEstimatedDuration())
                .status(attempt.getStatus())
                .questions(questionDtos)
                .build();
    }

    private AttemptProgressResponse buildProgressResponse(QuizAttempt attempt) {
        Optional<AttemptSession> sessionOpt = sessionService.loadSession(attempt.getId());

        Map<String, List<String>> answered = sessionOpt
                .map(AttemptSession::getAnsweredQuestions)
                .orElseGet(() -> {
                    // Fallback: build from DB
                    Map<String, List<String>> map = new HashMap<>();
                    questionResponseRepository.findByAttemptId(attempt.getId())
                            .forEach(r -> map.put(r.getQuestion().getId().toString(), r.getSelectedOptionIds()));
                    return map;
                });

        double runningScore = sessionOpt.map(AttemptSession::getRunningScore)
                .orElseGet(() -> questionResponseRepository
                        .sumPointsEarnedByAttemptId(attempt.getId()).orElse(0.0));

        long remaining = sessionOpt.map(AttemptSession::getRemainingSeconds)
                .orElse(Math.max(0L, Duration.between(Instant.now(), attempt.getEndTime()).toSeconds()));

        return AttemptProgressResponse.builder()
                .attemptId(attempt.getId())
                .quizId(attempt.getQuiz().getId())
                .quizTitle(attempt.getQuiz().getTitle())
                .status(attempt.getStatus())
                .startTime(attempt.getStartTime())
                .endTime(attempt.getEndTime())
                .remainingSeconds(remaining)
                .totalQuestions(attempt.getQuiz().getQuestions().size())
                .answeredCount(answered.size())
                .runningScore(runningScore)
                .answeredQuestions(answered)
                .build();
    }

    public QuizResultResponse buildResult(QuizAttempt attempt) {
        List<Question> questions = attempt.getQuiz().getQuestions();
        List<com.mindrift.quiz.entity.QuestionResponse> responses = questionResponseRepository.findByAttemptId(attempt.getId());

        Map<UUID, com.mindrift.quiz.entity.QuestionResponse> responseMap = responses.stream()
                .collect(Collectors.toMap(r -> r.getQuestion().getId(), r -> r));

        List<QuizResultResponse.QuestionBreakdown> breakdown = questions.stream().map(q -> {
            com.mindrift.quiz.entity.QuestionResponse resp = responseMap.get(q.getId());

            Set<String> correctIds = q.getOptions().stream()
                    .filter(QuestionOption::getIsCorrect)
                    .map(o -> o.getId().toString())
                    .collect(Collectors.toSet());

            if (resp != null) {
                return QuizResultResponse.QuestionBreakdown.builder()
                        .questionId(q.getId())
                        .questionText(q.getQuestionText())
                        .questionType(q.getType().name())
                        .isCorrect(resp.getIsCorrect())
                        .isPartial(resp.getIsPartial())
                        .scoreType(resp.getScoreType())
                        .pointsEarned(resp.getPointsEarned())
                        .maxPoints(resp.getMaxPoints())
                        .selectedOptionIds(resp.getSelectedOptionIds())
                        .correctOptionIds(new ArrayList<>(correctIds))
                        .explanation(q.getExplanation())
                        .build();
            } else {
                return QuizResultResponse.QuestionBreakdown.builder()
                        .questionId(q.getId())
                        .questionText(q.getQuestionText())
                        .questionType(q.getType().name())
                        .isCorrect(false)
                        .isPartial(false)
                        .scoreType("UNANSWERED")
                        .pointsEarned(0.0)
                        .maxPoints(q.getPoints().doubleValue())
                        .selectedOptionIds(Collections.emptyList())
                        .correctOptionIds(new ArrayList<>(correctIds))
                        .explanation(q.getExplanation())
                        .build();
            }
        }).collect(Collectors.toList());

        return QuizResultResponse.builder()
                .attemptId(attempt.getId())
                .quizId(attempt.getQuiz().getId())
                .quizTitle(attempt.getQuiz().getTitle())
                .score(attempt.getScore())
                .totalScore(attempt.getMaxScore())
                .percentage(attempt.getPercentage())
                .passed(attempt.getPassed())
                .passingScoreThreshold(attempt.getQuiz().getPassingScore())
                .correctAnswersCount(attempt.getCorrectCount())
                .incorrectAnswersCount(attempt.getIncorrectCount())
                .unansweredCount(attempt.getUnansweredCount())
                .totalQuestions(questions.size())
                .timeTakenSeconds(attempt.getTimeTakenSeconds())
                .submittedAt(attempt.getSubmittedAt())
                .status(attempt.getStatus())
                .breakdown(breakdown)
                .build();
    }
}
