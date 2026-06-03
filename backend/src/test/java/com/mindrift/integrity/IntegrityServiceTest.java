package com.mindrift.integrity;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.mindrift.common.base.AuditService;
import com.mindrift.integrity.dto.*;
import com.mindrift.integrity.entity.*;
import com.mindrift.integrity.repository.*;
import com.mindrift.integrity.service.*;
import com.mindrift.quiz.entity.QuizAttempt;
import com.mindrift.quiz.repository.QuizAttemptRepository;
import com.mindrift.user.entity.User;
import com.mindrift.user.repository.UserRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for IntegrityService — Mockito, no Spring context.
 */
@ExtendWith(MockitoExtension.class)
class IntegrityServiceTest {

    @Mock private ViolationEventRepository   violationRepo;
    @Mock private RiskScoreRepository        riskScoreRepo;
    @Mock private ProctoringSessionRepository proctoringRepo;
    @Mock private IntegrityReportRepository  reportRepo;
    @Mock private UserRepository             userRepository;
    @Mock private QuizAttemptRepository      attemptRepository;
    @Mock private IntegrityEventPublisher    eventPublisher;
    @Mock private AuditService               auditService;

    @Spy  private RiskScoringEngine scoringEngine = new RiskScoringEngine();

    @InjectMocks
    private IntegrityService integrityService;

    private User user;
    private UUID userId;
    private UUID attemptId;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() throws Exception {
        objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
        Field f = IntegrityService.class.getDeclaredField("objectMapper");
        f.setAccessible(true);
        f.set(integrityService, objectMapper);

        user      = new User();
        userId    = UUID.randomUUID();
        attemptId = UUID.randomUUID();
        setId(user, userId);
        user.setEmail("unit@mindrift.test");
        user.setUsername("unituser");
    }

    // ─── recordViolation ─────────────────────────────────────────────────────

    @Test
    void recordViolation_firstTabSwitch_returnsSafeLevel() {
        mockRiskScoreNotFound();
        mockSaves();

        ViolationResponse resp = integrityService.recordViolation(
                buildRequest(ViolationType.TAB_SWITCH),
                user, "127.0.0.1", "TestAgent");

        assertThat(resp.getViolationType()).isEqualTo(ViolationType.TAB_SWITCH);
        assertThat(resp.getUpdatedRiskLevel()).isIn(RiskLevel.LOW, RiskLevel.SAFE);
        assertThat(resp.isAutoActionTriggered()).isFalse();
        assertThat(resp.getClientAction()).isIn("NONE", "WARN");
    }

    @Test
    void recordViolation_duplicateSubmission_escalatesToHigh() {
        mockRiskScoreNotFound();
        mockSaves();

        ViolationResponse resp = integrityService.recordViolation(
                buildRequest(ViolationType.DUPLICATE_SUBMISSION),
                user, "127.0.0.1", "TestAgent");

        // Base score for DUPLICATE_SUBMISSION is 50 → HIGH
        assertThat(resp.getUpdatedRiskScore()).isGreaterThanOrEqualTo(50);
        assertThat(resp.getUpdatedRiskLevel()).isIn(RiskLevel.HIGH, RiskLevel.CRITICAL);
    }

    @Test
    void recordViolation_criticalScore_triggersAutoAction() {
        // Pre-existing score at 85 (HIGH) — adding MULTIPLE_SESSIONS (40) should push to 100 (CRITICAL)
        RiskScore existingRs = buildRiskScore(85, RiskLevel.HIGH);
        when(riskScoreRepo.findByAttemptId(attemptId)).thenReturn(Optional.of(existingRs));
        when(riskScoreRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(violationRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(attemptRepository.findById(attemptId)).thenReturn(Optional.of(new QuizAttempt()));
        when(attemptRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ViolationResponse resp = integrityService.recordViolation(
                buildRequest(ViolationType.MULTIPLE_SESSIONS),
                user, "10.0.0.1", "Agent");

        assertThat(resp.isAutoActionTriggered()).isTrue();
        assertThat(resp.getClientAction()).isEqualTo("TERMINATE");
        verify(eventPublisher, atLeastOnce()).publish(any(IntegrityViolationEvent.class));
    }

    @Test
    void recordViolation_alwaysPublishesKafkaEvent() {
        mockRiskScoreNotFound();
        mockSaves();

        integrityService.recordViolation(
                buildRequest(ViolationType.PASTE_ATTEMPT),
                user, "127.0.0.1", "TestAgent");

        verify(eventPublisher, atLeastOnce()).publish(any(IntegrityViolationEvent.class));
    }

    @Test
    void recordViolation_alwaysWritesAuditLog() {
        mockRiskScoreNotFound();
        mockSaves();

        integrityService.recordViolation(
                buildRequest(ViolationType.FULLSCREEN_EXIT),
                user, "192.168.1.1", "TestAgent");

        verify(auditService).logAction(eq(user), eq("INTEGRITY_VIOLATION"), any(), any(), any());
    }

    // ─── generateReport ──────────────────────────────────────────────────────

    @Test
    void generateReport_noViolations_createsSafeReport() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(riskScoreRepo.findByAttemptId(attemptId)).thenReturn(Optional.empty());
        when(violationRepo.countByTypeForAttempt(attemptId)).thenReturn(java.util.Collections.emptyList());
        when(proctoringRepo.findByAttemptId(attemptId)).thenReturn(Optional.empty());
        when(attemptRepository.findById(attemptId)).thenReturn(Optional.empty());
        when(reportRepo.findByAttemptId(attemptId)).thenReturn(Optional.empty());
        when(reportRepo.save(any())).thenAnswer(inv -> {
            IntegrityReport r = inv.getArgument(0);
            setId(r, UUID.randomUUID());
            return r;
        });
        when(riskScoreRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        IntegrityReport report = integrityService.generateReport(attemptId, userId);

        assertThat(report.getRiskLevel()).isEqualTo(RiskLevel.SAFE);
        assertThat(report.getModerationStatus()).isEqualTo("CLEARED");
        assertThat(report.getAutoDisqualified()).isFalse();
    }

    // ─── recordViolation: frequency multiplier ────────────────────────────────

    @Test
    void recordViolation_secondTabSwitch_addsMorePoints() {
        // First violation created existing risk score at LOW
        RiskScore existing = buildRiskScore(8, RiskLevel.LOW);
        existing.setTabSwitchCount(1); // Already had one tab switch
        when(riskScoreRepo.findByAttemptId(attemptId)).thenReturn(Optional.of(existing));
        when(riskScoreRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(violationRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ViolationResponse resp = integrityService.recordViolation(
                buildRequest(ViolationType.TAB_SWITCH),
                user, "127.0.0.1", "Agent");

        // Second tab switch = base * 1.5 = 12 more points → total should be 8+12=20
        assertThat(resp.getUpdatedRiskScore()).isGreaterThan(8);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private void mockRiskScoreNotFound() {
        when(riskScoreRepo.findByAttemptId(attemptId)).thenReturn(Optional.empty());
    }

    private void mockSaves() {
        when(violationRepo.save(any())).thenAnswer(inv -> {
            ViolationEvent v = inv.getArgument(0);
            setId(v, UUID.randomUUID());
            return v;
        });
        when(riskScoreRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    private ReportViolationRequest buildRequest(ViolationType type) {
        return ReportViolationRequest.builder()
                .attemptId(attemptId)
                .violationType(type)
                .occurredAt(Instant.now())
                .elapsedSeconds(120L)
                .description("test violation")
                .build();
    }

    private RiskScore buildRiskScore(int score, RiskLevel level) {
        RiskScore rs = new RiskScore();
        rs.setUser(user);
        rs.setAttemptId(attemptId);
        rs.setRiskScore(score);
        rs.setRiskLevel(level);
        rs.setTotalViolations(1);
        rs.setAutoActionTaken(false);
        return rs;
    }

    private void setId(Object entity, UUID id) throws Exception {
        try {
            Field f = com.mindrift.common.base.BaseEntity.class.getDeclaredField("id");
            f.setAccessible(true);
            f.set(entity, id);
        } catch (Exception e) { /* ignore for inner classes */ }
    }
}
