package com.mindrift.analytics;

import com.mindrift.BaseIntegrationTest;
import com.mindrift.analytics.dto.AttemptFinalisedAnalyticsEvent;
import com.mindrift.analytics.dto.UserAnalyticsResponse;
import com.mindrift.analytics.entity.SkillAnalytics;
import com.mindrift.analytics.entity.UserAnalytics;
import com.mindrift.analytics.repository.SkillAnalyticsRepository;
import com.mindrift.analytics.repository.UserAnalyticsRepository;
import com.mindrift.analytics.service.AnalyticsService;
import com.mindrift.quiz.entity.Category;
import com.mindrift.quiz.repository.CategoryRepository;
import com.mindrift.user.entity.User;
import com.mindrift.user.repository.UserRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

/**
 * Integration tests for the Analytics Engine.
 * Validates incremental updates, skill mastery computation, and read endpoints.
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AnalyticsServiceIntegrationTest extends BaseIntegrationTest {

    @Autowired private AnalyticsService            analyticsService;
    @Autowired private UserAnalyticsRepository     userAnalyticsRepo;
    @Autowired private SkillAnalyticsRepository    skillAnalyticsRepo;
    @Autowired private UserRepository              userRepository;
    @Autowired private CategoryRepository          categoryRepository;

    private static User testUser;
    private static UUID testUserId;
    private static UUID testQuizId;
    private static UUID testCategoryId;

    @BeforeEach
    void setup() {
        if (testUser == null) {
            Category cat = new Category();
            cat.setName("Science");
            cat.setSlug("science-" + UUID.randomUUID());
            cat = categoryRepository.save(cat);
            testCategoryId = cat.getId();

            testUser = new User();
            testUser.setClerkId("clerk_analytics_" + UUID.randomUUID());
            testUser.setEmail("analytics-" + UUID.randomUUID() + "@mindrift.test");
            testUser.setUsername("analyticsplayer");
            testUser = userRepository.save(testUser);
            testUserId = testUser.getId();

            testQuizId = UUID.randomUUID(); // stub quiz ID — QuizAnalytics upsert handles missing quiz
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  processAttemptFinalised
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @Order(1)
    @Transactional
    void processAttemptFinalised_firstAttempt_createsUserAnalytics() {
        AttemptFinalisedAnalyticsEvent event = buildEvent(80.0, true, false);

        analyticsService.processAttemptFinalised(event);

        Optional<UserAnalytics> ua = userAnalyticsRepo.findByUserId(testUserId);
        assertThat(ua).isPresent();
        assertThat(ua.get().getTotalAttempts()).isEqualTo(1L);
        assertThat(ua.get().getSubmittedAttempts()).isEqualTo(1L);
        assertThat(ua.get().getPassedAttempts()).isEqualTo(1L);
        assertThat(ua.get().getTotalScore()).isEqualTo(80.0);
    }

    @Test
    @Order(2)
    @Transactional
    void processAttemptFinalised_secondAttempt_accumulatesStats() {
        AttemptFinalisedAnalyticsEvent event = buildEvent(90.0, true, false);
        analyticsService.processAttemptFinalised(event);

        Optional<UserAnalytics> ua = userAnalyticsRepo.findByUserId(testUserId);
        assertThat(ua).isPresent();
        assertThat(ua.get().getSubmittedAttempts()).isGreaterThanOrEqualTo(2L);
        assertThat(ua.get().getBestScore()).isEqualTo(90.0);
    }

    @Test
    @Order(3)
    @Transactional
    void processAttemptFinalised_perfectScore_incrementsPerfectCount() {
        AttemptFinalisedAnalyticsEvent event = buildEvent(100.0, true, true);
        analyticsService.processAttemptFinalised(event);

        Optional<UserAnalytics> ua = userAnalyticsRepo.findByUserId(testUserId);
        assertThat(ua).isPresent();
        assertThat(ua.get().getPerfectScoreCount()).isGreaterThanOrEqualTo(1L);
    }

    @Test
    @Order(4)
    @Transactional
    void processAttemptFinalised_withCategory_createsSkillAnalytics() {
        AttemptFinalisedAnalyticsEvent event = AttemptFinalisedAnalyticsEvent.builder()
                .eventType("ATTEMPT_SUBMITTED")
                .attemptId(UUID.randomUUID())
                .userId(testUserId)
                .quizId(testQuizId)
                .categoryId(testCategoryId)
                .score(75.0)
                .maxScore(100.0)
                .percentage(75.0)
                .passed(true)
                .correctCount(15)
                .incorrectCount(4)
                .unansweredCount(1)
                .timeTakenSeconds(400L)
                .attemptNumber(1)
                .difficulty("MEDIUM")
                .occurredAt(Instant.now())
                .build();

        analyticsService.processAttemptFinalised(event);

        Optional<SkillAnalytics> skill =
                skillAnalyticsRepo.findByUserIdAndCategoryId(testUserId, testCategoryId);
        assertThat(skill).isPresent();
        assertThat(skill.get().getAttemptsInCategory()).isEqualTo(1L);
        assertThat(skill.get().getMasteryScore()).isGreaterThan(0.0);
        assertThat(skill.get().getSkillLevel()).isNotBlank();
    }

    @Test
    @Order(5)
    @Transactional
    void processAttemptFinalised_expiredAttempt_doesNotCountAsSubmitted() {
        long prevSubmitted = userAnalyticsRepo.findByUserId(testUserId)
                .map(UserAnalytics::getSubmittedAttempts).orElse(0L);

        AttemptFinalisedAnalyticsEvent event = AttemptFinalisedAnalyticsEvent.builder()
                .eventType("ATTEMPT_EXPIRED")  // expired — not submitted
                .attemptId(UUID.randomUUID())
                .userId(testUserId)
                .quizId(testQuizId)
                .score(50.0)
                .maxScore(100.0)
                .percentage(50.0)
                .passed(false)
                .correctCount(10)
                .incorrectCount(5)
                .unansweredCount(5)
                .timeTakenSeconds(900L)
                .attemptNumber(4)
                .difficulty("EASY")
                .occurredAt(Instant.now())
                .build();

        analyticsService.processAttemptFinalised(event);

        long afterSubmitted = userAnalyticsRepo.findByUserId(testUserId)
                .map(UserAnalytics::getSubmittedAttempts).orElse(0L);
        assertThat(afterSubmitted).isEqualTo(prevSubmitted); // expired must not increment submitted count
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  getUserAnalytics READ
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @Order(6)
    void getUserAnalytics_shouldReturnPopulatedResponse() {
        UserAnalyticsResponse resp = analyticsService.getUserAnalytics(testUserId);
        assertThat(resp).isNotNull();
        assertThat(resp.getUserId()).isEqualTo(testUserId);
        assertThat(resp.getTotalAttempts()).isGreaterThan(0L);
        assertThat(resp.getAverageScore()).isGreaterThan(0.0);
    }

    @Test
    @Order(7)
    void getUserAnalytics_missingUser_throwsResourceNotFound() {
        UUID nonExistentId = UUID.randomUUID();
        assertThatThrownBy(() -> analyticsService.getUserAnalytics(nonExistentId))
                .isInstanceOf(com.mindrift.common.exception.ResourceNotFoundException.class);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Skill trend calculation
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @Order(8)
    @Transactional
    void skillAnalytics_improvingTrend_detectedAfterMultipleAttempts() {
        // Feed improving scores: 50, 55, 60, 70, 80, 85, 88, 90, 92, 95
        double[] scores = {50, 55, 60, 70, 80, 85, 88, 90, 92, 95};
        for (double score : scores) {
            AttemptFinalisedAnalyticsEvent e = AttemptFinalisedAnalyticsEvent.builder()
                    .eventType("ATTEMPT_SUBMITTED")
                    .attemptId(UUID.randomUUID())
                    .userId(testUserId)
                    .quizId(testQuizId)
                    .categoryId(testCategoryId)
                    .score(score)
                    .maxScore(100.0)
                    .percentage(score)
                    .passed(score >= 70)
                    .correctCount((int)(score / 5))
                    .incorrectCount(2)
                    .unansweredCount(0)
                    .timeTakenSeconds(300L)
                    .attemptNumber(1)
                    .difficulty("MEDIUM")
                    .occurredAt(Instant.now())
                    .build();
            analyticsService.processAttemptFinalised(e);
        }

        Optional<SkillAnalytics> skill =
                skillAnalyticsRepo.findByUserIdAndCategoryId(testUserId, testCategoryId);
        assertThat(skill).isPresent();
        assertThat(skill.get().getTrend()).isEqualTo("IMPROVING");
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private AttemptFinalisedAnalyticsEvent buildEvent(double percentage, boolean passed,
                                                       boolean perfectScore) {
        return AttemptFinalisedAnalyticsEvent.builder()
                .eventType("ATTEMPT_SUBMITTED")
                .attemptId(UUID.randomUUID())
                .userId(testUserId)
                .quizId(testQuizId)
                .score(percentage)
                .maxScore(100.0)
                .percentage(percentage)
                .passed(passed)
                .correctCount(perfectScore ? 20 : 16)
                .incorrectCount(perfectScore ? 0 : 3)
                .unansweredCount(perfectScore ? 0 : 1)
                .timeTakenSeconds(350L)
                .attemptNumber(1)
                .difficulty("MEDIUM")
                .occurredAt(Instant.now())
                .build();
    }
}
