package com.mindrift.integrity.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindrift.analytics.service.AnalyticsService;
import com.mindrift.common.base.AuditService;
import com.mindrift.common.exception.ResourceNotFoundException;
import com.mindrift.integrity.dto.*;
import com.mindrift.integrity.entity.*;
import com.mindrift.integrity.repository.*;
import com.mindrift.quiz.entity.QuizAttempt;
import com.mindrift.quiz.entity.QuizAttemptStatus;
import com.mindrift.quiz.repository.QuizAttemptRepository;
import com.mindrift.user.entity.User;
import com.mindrift.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Core Anti-Cheat & Integrity Service.
 *
 * Write path:
 *   1. Browser SDK → POST /violations → recordViolation()
 *   2. recordViolation saves ViolationEvent
 *   3. upserts RiskScore, computes new score via RiskScoringEngine
 *   4. triggers auto-action if CRITICAL/HIGH
 *   5. publishes Kafka event to "integrity-events"
 *   6. writes audit log
 *
 * Read path:
 *   - getReport()      → GET /reports/{attemptId}
 *   - generateReport() → called on attempt completion
 *   - disqualify()     → POST /moderation/disqualify
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class IntegrityService {

    private static final String KAFKA_TOPIC = "integrity-events";

    private final ViolationEventRepository      violationRepo;
    private final RiskScoreRepository           riskScoreRepo;
    private final ProctoringSessionRepository   proctoringRepo;
    private final IntegrityReportRepository     reportRepo;
    private final UserRepository                userRepository;
    private final QuizAttemptRepository         attemptRepository;
    private final RiskScoringEngine             scoringEngine;
    private final IntegrityEventPublisher       eventPublisher;
    private final AuditService                  auditService;
    private final ObjectMapper                  objectMapper;

    // ─────────────────────────────────────────────────────────────────────────
    //  RECORD VIOLATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Main ingestion point for browser-reported violations.
     * Called by IntegrityController on POST /api/integrity/violations.
     */
    @Transactional
    public ViolationResponse recordViolation(ReportViolationRequest request,
                                             User user,
                                             String ipAddress,
                                             String userAgent) {
        log.debug("Recording violation: type={} attempt={} user={}",
                request.getViolationType(), request.getAttemptId(), user.getId());

        // SECURITY GUARD: Check attempt ownership (Broken Object Level Authorization Fix)
        com.mindrift.quiz.entity.QuizAttempt attempt = attemptRepository.findById(request.getAttemptId())
                .orElseThrow(() -> new ResourceNotFoundException("Attempt not found: " + request.getAttemptId()));
        if (!attempt.getUser().getId().equals(user.getId())) {
            log.error("SECURITY VIOLATION: User {} attempted to report cheating violation for attempt {} owned by user {}",
                    user.getId(), attempt.getId(), attempt.getUser().getId());
            throw new com.mindrift.common.exception.MindriftException(
                    "Access Denied: You do not own this attempt.", com.mindrift.common.exception.ErrorCode.FORBIDDEN);
        }

        // 1. Classify this specific violation
        int basePoints = scoringEngine.basePoints(request.getViolationType());
        RiskLevel violationLevel = scoringEngine.classify(basePoints);

        // 2. Persist ViolationEvent
        ViolationEvent event = new ViolationEvent();
        event.setUser(user);
        event.setAttemptId(request.getAttemptId());
        event.setCompetitionId(request.getCompetitionId());
        event.setViolationType(request.getViolationType());
        event.setRiskLevel(violationLevel);
        event.setSource("BROWSER");
        event.setEvidenceJson(request.getEvidenceJson());
        event.setDescription(request.getDescription());
        event.setOccurredAt(request.getOccurredAt() != null ? request.getOccurredAt() : Instant.now());
        event.setElapsedSeconds(request.getElapsedSeconds());
        event.setIpAddress(ipAddress);
        event.setUserAgent(userAgent);
        ViolationEvent saved = violationRepo.save(event);

        // 3. Upsert RiskScore
        RiskScore riskScore = upsertRiskScore(user, request, saved.getOccurredAt());

        // 4. Auto-action if warranted
        boolean autoAction = false;
        String  autoType   = null;
        if (riskScore.getRiskLevel().requiresAutoAction() && !riskScore.getAutoActionTaken()) {
            autoAction = triggerAutoAction(riskScore, user);
            autoType   = riskScore.getAutoActionType();
        }

        // 5. Publish Kafka event
        eventPublisher.publish(IntegrityViolationEvent.builder()
                .eventType("VIOLATION_RECORDED")
                .violationId(saved.getId())
                .attemptId(request.getAttemptId())
                .userId(user.getId())
                .competitionId(request.getCompetitionId())
                .violationType(request.getViolationType().name())
                .riskLevel(riskScore.getRiskLevel().name())
                .riskScore(riskScore.getRiskScore())
                .autoActionTriggered(autoAction)
                .autoActionType(autoType)
                .occurredAt(saved.getOccurredAt())
                .build());

        // 6. Audit log
        auditService.logAction(user, "INTEGRITY_VIOLATION",
                Map.of("type", request.getViolationType().name(),
                        "riskScore", String.valueOf(riskScore.getRiskScore()),
                        "attemptId", request.getAttemptId().toString()),
                ipAddress, userAgent);

        String directive = scoringEngine.clientDirective(riskScore.getRiskLevel(), autoAction);

        return ViolationResponse.builder()
                .violationId(saved.getId())
                .attemptId(request.getAttemptId())
                .violationType(request.getViolationType())
                .violationRiskLevel(violationLevel)
                .updatedRiskScore(riskScore.getRiskScore())
                .updatedRiskLevel(riskScore.getRiskLevel())
                .autoActionTriggered(autoAction)
                .autoActionType(autoType)
                .clientAction(directive)
                .processedAt(Instant.now())
                .build();
    }

    /**
     * Record a server-side integrity violation (IP mismatch, duplicate submission, etc.)
     * Called internally — no HTTP context.
     */
    @Transactional
    public void recordServerViolation(UUID attemptId, UUID userId, ViolationType type,
                                      String description, String evidence) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;

        ViolationEvent event = new ViolationEvent();
        event.setUser(user);
        event.setAttemptId(attemptId);
        event.setViolationType(type);
        event.setRiskLevel(scoringEngine.classify(scoringEngine.basePoints(type)));
        event.setSource("SERVER");
        event.setDescription(description);
        event.setEvidenceJson(evidence);
        event.setOccurredAt(Instant.now());
        violationRepo.save(event);

        // Update risk score
        upsertRiskScoreServerSide(user, attemptId, type, event.getOccurredAt());

        eventPublisher.publish(IntegrityViolationEvent.builder()
                .eventType("SERVER_VIOLATION")
                .attemptId(attemptId)
                .userId(userId)
                .violationType(type.name())
                .riskLevel(scoringEngine.classify(scoringEngine.basePoints(type)).name())
                .riskScore(scoringEngine.basePoints(type))
                .occurredAt(Instant.now())
                .build());

        log.warn("Server-side integrity violation: type={} attempt={} user={}", type, attemptId, userId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  GET / GENERATE REPORT
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public IntegrityReportResponse getReport(UUID attemptId) {
        IntegrityReport report = reportRepo.findByAttemptId(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No integrity report found for attempt: " + attemptId));
        return toReportResponse(report);
    }

    /**
     * Generates (or regenerates) the integrity report for an attempt.
     * Called when an attempt is finalised.
     */
    @Transactional
    public IntegrityReport generateReport(UUID attemptId, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        // Load/create riskScore
        RiskScore rs = riskScoreRepo.findByAttemptId(attemptId)
                .orElseGet(() -> {
                    RiskScore empty = new RiskScore();
                    empty.setUser(user);
                    empty.setAttemptId(attemptId);
                    return empty;
                });

        // Build violation summary map
        List<Object[]> counts = violationRepo.countByTypeForAttempt(attemptId);
        Map<String, Long> summaryMap = counts.stream().collect(
                Collectors.toMap(row -> row[0].toString(), row -> (Long) row[1]));
        String summaryJson = toJson(summaryMap);

        // Proctoring
        Optional<ProctoringSession> proc = proctoringRepo.findByAttemptId(attemptId);

        // Attempt timestamps
        Optional<QuizAttempt> attempt = attemptRepository.findById(attemptId);

        // Upsert report
        IntegrityReport report = reportRepo.findByAttemptId(attemptId)
                .orElseGet(IntegrityReport::new);

        report.setUser(user);
        report.setAttemptId(attemptId);
        report.setRiskScore(rs.getRiskScore());
        report.setRiskLevel(rs.getRiskLevel());
        report.setTotalViolations(rs.getTotalViolations());
        report.setViolationSummary(summaryJson);
        report.setGeneratedAt(Instant.now());
        report.setAutoDisqualified(Boolean.TRUE.equals(rs.getAutoActionTaken())
                && "DISQUALIFIED".equals(rs.getAutoActionType()));
        if (Boolean.TRUE.equals(report.getAutoDisqualified())) {
            report.setAutoDisqualifiedAt(rs.getAutoActionAt());
            report.setAutoDisqualificationReason("Automated: risk score " + rs.getRiskScore()
                    + " (level " + rs.getRiskLevel() + ")");
        }

        proc.ifPresent(p -> {
            report.setWasProctored(true);
            report.setProctoringSessionId(p.getId());
            report.setFaceDetectionRate(p.getFaceDetectionRate());
        });

        attempt.ifPresent(a -> {
            report.setAttemptStartTime(a.getStartTime());
            report.setAttemptEndTime(a.getSubmittedAt() != null ? a.getSubmittedAt() : a.getEndTime());
        });

        // Moderation status: only set PENDING if not already decided
        if (report.getModerationStatus() == null) {
            report.setModerationStatus(rs.getRiskLevel().requiresReview() ? "PENDING" : "CLEARED");
        }

        IntegrityReport saved = reportRepo.save(report);
        log.info("Integrity report generated: attemptId={} riskLevel={} score={}",
                attemptId, rs.getRiskLevel(), rs.getRiskScore());

        // Publish escalation event if high-risk
        if (rs.getRiskLevel().requiresReview()) {
            eventPublisher.publish(IntegrityViolationEvent.builder()
                    .eventType("RISK_ESCALATED")
                    .attemptId(attemptId)
                    .userId(userId)
                    .riskLevel(rs.getRiskLevel().name())
                    .riskScore(rs.getRiskScore())
                    .occurredAt(Instant.now())
                    .build());
        }

        return saved;
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  MODERATION: DISQUALIFY
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public IntegrityReportResponse disqualify(DisqualifyRequest request,
                                              User moderator,
                                              String ipAddress,
                                              String userAgent) {
        IntegrityReport report = reportRepo.findByAttemptId(request.getAttemptId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No report found for attempt: " + request.getAttemptId()));

        report.setModerationStatus("DISQUALIFIED");
        report.setModeratorId(moderator.getId());
        report.setModeratorUsername(moderator.getUsername());
        report.setModerationNotes(request.getReason());
        report.setModeratedAt(Instant.now());
        report.setAutoDisqualified(false); // manual override

        if (request.isInvalidateScore()) {
            // Mark attempt as DISQUALIFIED by cancelling it
            attemptRepository.findById(request.getAttemptId()).ifPresent(attempt -> {
                attempt.setStatus(QuizAttemptStatus.CANCELLED);
                attemptRepository.save(attempt);
            });
        }

        IntegrityReport saved = reportRepo.save(report);

        // Publish Kafka event
        eventPublisher.publish(IntegrityViolationEvent.builder()
                .eventType("MANUAL_DISQUALIFIED")
                .attemptId(request.getAttemptId())
                .userId(report.getUser().getId())
                .competitionId(request.getCompetitionId())
                .riskLevel(report.getRiskLevel().name())
                .riskScore(report.getRiskScore())
                .autoActionTriggered(false)
                .occurredAt(Instant.now())
                .build());

        auditService.logAction(moderator, "MANUAL_DISQUALIFY",
                Map.of("attemptId", request.getAttemptId().toString(),
                        "reason", request.getReason(),
                        "invalidateScore", String.valueOf(request.isInvalidateScore())),
                ipAddress, userAgent);

        log.info("Manual disqualification: attempt={} by moderator={}",
                request.getAttemptId(), moderator.getId());

        return toReportResponse(saved);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  MODERATOR: clear / warn
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public IntegrityReportResponse moderateReport(UUID reportId, String decision,
                                                   String notes, User moderator) {
        IntegrityReport report = reportRepo.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found: " + reportId));

        report.setModerationStatus(decision);
        report.setModeratorId(moderator.getId());
        report.setModeratorUsername(moderator.getUsername());
        report.setModerationNotes(notes);
        report.setModeratedAt(Instant.now());
        return toReportResponse(reportRepo.save(report));
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  PROCTORING SESSION
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public ProctoringSession startProctoringSession(UUID attemptId, User user,
                                                     boolean cameraConsented,
                                                     boolean micConsented,
                                                     boolean fullscreenRequired,
                                                     String ipAddress,
                                                     String userAgent) {
        ProctoringSession session = proctoringRepo.findByAttemptId(attemptId)
                .orElseGet(ProctoringSession::new);
        session.setUser(user);
        session.setAttemptId(attemptId);
        session.setStatus("ACTIVE");
        session.setCameraConsented(cameraConsented);
        session.setMicrophoneConsented(micConsented);
        session.setFullscreenRequired(fullscreenRequired);
        session.setStartedAt(Instant.now());
        session.setLastHeartbeatAt(Instant.now());
        session.setIpAddress(ipAddress);
        session.setUserAgent(userAgent);
        return proctoringRepo.save(session);
    }

    @Transactional
    public void updateProctoringHeartbeat(UUID attemptId) {
        proctoringRepo.findByAttemptId(attemptId).ifPresent(s -> {
            s.setLastHeartbeatAt(Instant.now());
            proctoringRepo.save(s);
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  READ: Moderation queues
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<IntegrityReportResponse> getPendingModerationQueue(Pageable pageable) {
        return reportRepo.findByModerationStatusOrderByGeneratedAtDesc("PENDING", pageable)
                .map(this::toReportResponse);
    }

    @Transactional(readOnly = true)
    public Page<IntegrityReportResponse> getReportsByUser(UUID userId, Pageable pageable) {
        return reportRepo.findByUserIdOrderByGeneratedAtDesc(userId, pageable)
                .map(this::toReportResponse);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  PRIVATE: Risk score upsert
    // ─────────────────────────────────────────────────────────────────────────

    private RiskScore upsertRiskScore(User user, ReportViolationRequest request, Instant occurredAt) {
        RiskScore rs = riskScoreRepo.findByAttemptId(request.getAttemptId())
                .orElseGet(() -> {
                    RiskScore fresh = new RiskScore();
                    fresh.setUser(user);
                    fresh.setAttemptId(request.getAttemptId());
                    fresh.setCompetitionId(request.getCompetitionId());
                    fresh.setFirstViolationAt(occurredAt);
                    return fresh;
                });

        // Update violation type counters
        ViolationType type = request.getViolationType();
        long prevCount = countForType(rs, type);
        int delta = scoringEngine.incrementalPoints(type, prevCount);

        incrementCounter(rs, type);
        rs.setTotalViolations(rs.getTotalViolations() + 1);
        rs.setLastViolationAt(occurredAt);

        int newScore = Math.min(rs.getRiskScore() + delta, 100);
        rs.setRiskScore(newScore);
        rs.setRiskLevel(scoringEngine.classify(newScore));

        return riskScoreRepo.save(rs);
    }

    private RiskScore upsertRiskScoreServerSide(User user, UUID attemptId,
                                                 ViolationType type, Instant occurredAt) {
        RiskScore rs = riskScoreRepo.findByAttemptId(attemptId)
                .orElseGet(() -> {
                    RiskScore fresh = new RiskScore();
                    fresh.setUser(user);
                    fresh.setAttemptId(attemptId);
                    fresh.setFirstViolationAt(occurredAt);
                    return fresh;
                });

        long prevCount = countForType(rs, type);
        int delta = scoringEngine.incrementalPoints(type, prevCount);
        incrementCounter(rs, type);
        rs.setServerSideCount(rs.getServerSideCount() + 1);
        rs.setTotalViolations(rs.getTotalViolations() + 1);
        rs.setLastViolationAt(occurredAt);

        int newScore = Math.min(rs.getRiskScore() + delta, 100);
        rs.setRiskScore(newScore);
        rs.setRiskLevel(scoringEngine.classify(newScore));

        return riskScoreRepo.save(rs);
    }

    private long countForType(RiskScore rs, ViolationType type) {
        return switch (type) {
            case TAB_SWITCH, WINDOW_BLUR -> rs.getTabSwitchCount();
            case COPY_ATTEMPT, PASTE_ATTEMPT, CUT_ATTEMPT -> rs.getCopyPasteCount();
            case FULLSCREEN_EXIT -> rs.getFullscreenExitCount();
            case DEVTOOLS_OPEN, CONSOLE_ACCESS, DEBUGGER_DETECTED -> rs.getDevtoolsCount();
            case RAPID_ANSWER_CHANGE, ANSWER_FLOOD, IMPOSSIBLE_TIMING -> rs.getRapidChangeCount();
            default -> rs.getServerSideCount();
        };
    }

    private void incrementCounter(RiskScore rs, ViolationType type) {
        switch (type) {
            case TAB_SWITCH, WINDOW_BLUR -> rs.setTabSwitchCount(rs.getTabSwitchCount() + 1);
            case COPY_ATTEMPT, PASTE_ATTEMPT, CUT_ATTEMPT -> rs.setCopyPasteCount(rs.getCopyPasteCount() + 1);
            case FULLSCREEN_EXIT -> rs.setFullscreenExitCount(rs.getFullscreenExitCount() + 1);
            case DEVTOOLS_OPEN, CONSOLE_ACCESS, DEBUGGER_DETECTED -> rs.setDevtoolsCount(rs.getDevtoolsCount() + 1);
            case RAPID_ANSWER_CHANGE, ANSWER_FLOOD, IMPOSSIBLE_TIMING -> rs.setRapidChangeCount(rs.getRapidChangeCount() + 1);
            default -> rs.setServerSideCount(rs.getServerSideCount() + 1);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  PRIVATE: Auto-action
    // ─────────────────────────────────────────────────────────────────────────

    private boolean triggerAutoAction(RiskScore rs, User user) {
        String actionType = rs.getRiskLevel() == RiskLevel.CRITICAL ? "DISQUALIFIED" : "SUSPENDED";
        rs.setAutoActionTaken(true);
        rs.setAutoActionType(actionType);
        rs.setAutoActionAt(Instant.now());
        riskScoreRepo.save(rs);

        if ("DISQUALIFIED".equals(actionType)) {
            // Cancel the attempt
            attemptRepository.findById(rs.getAttemptId()).ifPresent(attempt -> {
                attempt.setStatus(QuizAttemptStatus.CANCELLED);
                attemptRepository.save(attempt);
            });
        }

        log.warn("AUTO-ACTION triggered: {} — user={} attempt={} score={}",
                actionType, user.getId(), rs.getAttemptId(), rs.getRiskScore());

        eventPublisher.publish(IntegrityViolationEvent.builder()
                .eventType("AUTO_DISQUALIFIED")
                .attemptId(rs.getAttemptId())
                .userId(user.getId())
                .riskLevel(rs.getRiskLevel().name())
                .riskScore(rs.getRiskScore())
                .autoActionTriggered(true)
                .autoActionType(actionType)
                .occurredAt(Instant.now())
                .build());

        return true;
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  PRIVATE: Mapping
    // ─────────────────────────────────────────────────────────────────────────

    private IntegrityReportResponse toReportResponse(IntegrityReport r) {
        // Violation timeline
        List<ViolationEventDto> violations = violationRepo
                .findByAttemptIdOrderByOccurredAtAsc(r.getAttemptId())
                .stream()
                .map(v -> ViolationEventDto.builder()
                        .violationId(v.getId())
                        .violationType(v.getViolationType())
                        .riskLevel(v.getRiskLevel())
                        .source(v.getSource())
                        .description(v.getDescription())
                        .elapsedSeconds(v.getElapsedSeconds())
                        .occurredAt(v.getOccurredAt())
                        .evidenceJson(v.getEvidenceJson())
                        .reviewed(Boolean.TRUE.equals(v.getReviewed()))
                        .build())
                .toList();

        // Violation summary map
        Map<String, Long> breakdown = parseViolationSummary(r.getViolationSummary());

        // Proctoring session
        ProctoringSessionDto procDto = proctoringRepo.findByAttemptId(r.getAttemptId())
                .map(p -> ProctoringSessionDto.builder()
                        .sessionId(p.getId())
                        .status(p.getStatus())
                        .cameraConsented(Boolean.TRUE.equals(p.getCameraConsented()))
                        .microphoneConsented(Boolean.TRUE.equals(p.getMicrophoneConsented()))
                        .fullscreenRequired(Boolean.TRUE.equals(p.getFullscreenRequired()))
                        .framesCaptured(p.getFramesCaptured())
                        .faceDetectedFrames(p.getFaceDetectedFrames())
                        .noFaceFrames(p.getNoFaceFrames())
                        .multipleFaceFrames(p.getMultipleFaceFrames())
                        .faceDetectionRate(p.getFaceDetectionRate())
                        .heartbeatMissedCount(p.getHeartbeatMissedCount())
                        .startedAt(p.getStartedAt())
                        .endedAt(p.getEndedAt())
                        .flaggedForReview(Boolean.TRUE.equals(p.getFlaggedForReview()))
                        .flagReason(p.getFlagReason())
                        .build())
                .orElse(null);

        return IntegrityReportResponse.builder()
                .reportId(r.getId())
                .attemptId(r.getAttemptId())
                .userId(r.getUser().getId())
                .username(r.getUser().getUsername())
                .competitionId(r.getCompetitionId())
                .riskScore(r.getRiskScore())
                .riskLevel(r.getRiskLevel())
                .totalViolations(r.getTotalViolations())
                .violationBreakdown(breakdown)
                .violations(violations)
                .wasProctored(Boolean.TRUE.equals(r.getWasProctored()))
                .faceDetectionRate(r.getFaceDetectionRate())
                .proctoringSession(procDto)
                .moderationStatus(r.getModerationStatus())
                .moderatorUsername(r.getModeratorUsername())
                .moderationNotes(r.getModerationNotes())
                .moderatedAt(r.getModeratedAt())
                .autoDisqualified(Boolean.TRUE.equals(r.getAutoDisqualified()))
                .autoDisqualifiedAt(r.getAutoDisqualifiedAt())
                .autoDisqualificationReason(r.getAutoDisqualificationReason())
                .generatedAt(r.getGeneratedAt())
                .attemptStartTime(r.getAttemptStartTime())
                .attemptEndTime(r.getAttemptEndTime())
                .build();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Long> parseViolationSummary(String json) {
        try {
            if (json == null || "{}".equals(json)) return Collections.emptyMap();
            return objectMapper.readValue(json, Map.class);
        } catch (Exception e) { return Collections.emptyMap(); }
    }

    private String toJson(Object obj) {
        try { return objectMapper.writeValueAsString(obj); }
        catch (Exception e) { return "{}"; }
    }
}
