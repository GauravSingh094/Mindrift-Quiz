package com.mindrift.analytics;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.mindrift.analytics.dto.*;
import com.mindrift.analytics.entity.*;
import com.mindrift.analytics.repository.*;
import com.mindrift.analytics.service.AnalyticsService;
import com.mindrift.quiz.repository.QuizRepository;
import com.mindrift.quiz.repository.QuestionResponseRepository;
import com.mindrift.user.entity.User;
import com.mindrift.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AnalyticsService — fast, no Spring context, pure logic.
 */
@ExtendWith(MockitoExtension.class)
class AnalyticsServiceUnitTest {

    @Mock private UserAnalyticsRepository       userAnalyticsRepo;
    @Mock private QuizAnalyticsRepository       quizAnalyticsRepo;
    @Mock private CompetitionAnalyticsRepository compAnalyticsRepo;
    @Mock private SkillAnalyticsRepository      skillAnalyticsRepo;
    @Mock private AnalyticsSnapshotRepository   snapshotRepo;
    @Mock private UserRepository                userRepository;
    @Mock private QuizRepository                quizRepository;
    @Mock private QuestionResponseRepository    questionResponseRepo;

    @InjectMocks
    private AnalyticsService analyticsService;

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule());

    private User user;
    private UUID userId;
    private UUID quizId;

    @BeforeEach
    void setUp() throws Exception {
        // Inject ObjectMapper via reflection (not a Spring bean in unit tests)
        Field omField = AnalyticsService.class.getDeclaredField("objectMapper");
        omField.setAccessible(true);
        omField.set(analyticsService, objectMapper);

        user   = new User();
        userId = UUID.randomUUID();
        quizId = UUID.randomUUID();
        setId(user, userId);
        user.setEmail("unit@test.com");
        user.setUsername("unituser");
    }

    // ─── processAttemptFinalised ─────────────────────────────────────────────

    @Test
    void processAttemptFinalised_submittedEvent_savesUserAnalytics() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userAnalyticsRepo.findByUserId(userId)).thenReturn(Optional.empty());
        when(userAnalyticsRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(quizAnalyticsRepo.findByQuizId(quizId)).thenReturn(Optional.empty());
        when(quizAnalyticsRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(quizRepository.findById(quizId)).thenReturn(Optional.empty());

        AttemptFinalisedAnalyticsEvent event = buildEvent("ATTEMPT_SUBMITTED", 80.0, true);

        analyticsService.processAttemptFinalised(event);

        verify(userAnalyticsRepo).save(any(UserAnalytics.class));
        verify(quizAnalyticsRepo).save(any(QuizAnalytics.class));
    }

    @Test
    void processAttemptFinalised_nonFinalisedEvent_skipsProcessing() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        AttemptFinalisedAnalyticsEvent event = buildEvent("ATTEMPT_STARTED", 0.0, false);

        analyticsService.processAttemptFinalised(event);

        verify(userAnalyticsRepo, never()).save(any());
    }

    @Test
    void processAttemptFinalised_userNotFound_skipsGracefully() {
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        AttemptFinalisedAnalyticsEvent event = buildEvent("ATTEMPT_SUBMITTED", 80.0, true);

        // Should not throw
        assertThatCode(() -> analyticsService.processAttemptFinalised(event))
                .doesNotThrowAnyException();

        verify(userAnalyticsRepo, never()).save(any());
    }

    // ─── Score accumulation ───────────────────────────────────────────────────

    @Test
    void processAttemptFinalised_secondAttempt_incrementsTotalAttempts() {
        UserAnalytics existing = new UserAnalytics();
        existing.setUser(user);
        existing.setTotalAttempts(5L);
        existing.setSubmittedAttempts(5L);
        existing.setPassedAttempts(3L);
        existing.setTotalScore(400.0);
        existing.setBestScore(95.0);
        existing.setAveragePercentage(80.0);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userAnalyticsRepo.findByUserId(userId)).thenReturn(Optional.of(existing));
        when(userAnalyticsRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(quizAnalyticsRepo.findByQuizId(quizId)).thenReturn(Optional.empty());
        when(quizAnalyticsRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(quizRepository.findById(quizId)).thenReturn(Optional.empty());

        AttemptFinalisedAnalyticsEvent event = buildEvent("ATTEMPT_SUBMITTED", 90.0, true);

        analyticsService.processAttemptFinalised(event);

        ArgumentCaptor<UserAnalytics> captor = ArgumentCaptor.forClass(UserAnalytics.class);
        verify(userAnalyticsRepo).save(captor.capture());

        UserAnalytics saved = captor.getValue();
        assertThat(saved.getTotalAttempts()).isEqualTo(6L);
        assertThat(saved.getBestScore()).isEqualTo(95.0); // 90 < 95 so unchanged
        assertThat(saved.getTotalScore()).isEqualTo(490.0);
    }

    @Test
    void processAttemptFinalised_newBestScore_updatesBestScore() {
        UserAnalytics existing = new UserAnalytics();
        existing.setUser(user);
        existing.setTotalAttempts(2L);
        existing.setSubmittedAttempts(2L);
        existing.setBestScore(70.0);
        existing.setTotalScore(140.0);
        existing.setAveragePercentage(70.0);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userAnalyticsRepo.findByUserId(userId)).thenReturn(Optional.of(existing));
        when(userAnalyticsRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(quizAnalyticsRepo.findByQuizId(quizId)).thenReturn(Optional.empty());
        when(quizAnalyticsRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(quizRepository.findById(quizId)).thenReturn(Optional.empty());

        AttemptFinalisedAnalyticsEvent event = buildEvent("ATTEMPT_SUBMITTED", 95.0, true);

        analyticsService.processAttemptFinalised(event);

        ArgumentCaptor<UserAnalytics> captor = ArgumentCaptor.forClass(UserAnalytics.class);
        verify(userAnalyticsRepo).save(captor.capture());

        assertThat(captor.getValue().getBestScore()).isEqualTo(95.0);
    }

    // ─── getUserAnalytics ────────────────────────────────────────────────────

    @Test
    void getUserAnalytics_userNotFound_throwsResourceNotFound() {
        when(userRepository.findById(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> analyticsService.getUserAnalytics(UUID.randomUUID()))
                .isInstanceOf(com.mindrift.common.exception.ResourceNotFoundException.class);
    }

    @Test
    void getUserAnalytics_noAnalyticsYet_returnsZeroedResponse() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userAnalyticsRepo.findByUserId(userId)).thenReturn(Optional.empty());
        when(skillAnalyticsRepo.findByUserIdOrderByMasteryScoreDesc(userId))
                .thenReturn(Collections.emptyList());
        when(snapshotRepo.findBySubjectIdAndSubjectTypeAndGranularityOrderBySnapshotAtDesc(
                any(), any(), any())).thenReturn(Collections.emptyList());

        UserAnalyticsResponse response = analyticsService.getUserAnalytics(userId);

        assertThat(response).isNotNull();
        assertThat(response.getTotalAttempts()).isZero();
        assertThat(response.getAverageScore()).isZero();
        assertThat(response.getSkillBreakdown()).isEmpty();
        assertThat(response.getScoreHistory()).isEmpty();
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private AttemptFinalisedAnalyticsEvent buildEvent(String type, double pct, boolean passed) {
        return AttemptFinalisedAnalyticsEvent.builder()
                .eventType(type)
                .attemptId(UUID.randomUUID())
                .userId(userId)
                .quizId(quizId)
                .score(pct)
                .maxScore(100.0)
                .percentage(pct)
                .passed(passed)
                .correctCount(16)
                .incorrectCount(3)
                .unansweredCount(1)
                .timeTakenSeconds(350L)
                .attemptNumber(1)
                .difficulty("MEDIUM")
                .occurredAt(Instant.now())
                .build();
    }

    private void setId(Object entity, UUID id) throws Exception {
        Field f = com.mindrift.common.base.BaseEntity.class.getDeclaredField("id");
        f.setAccessible(true);
        f.set(entity, id);
    }
}
