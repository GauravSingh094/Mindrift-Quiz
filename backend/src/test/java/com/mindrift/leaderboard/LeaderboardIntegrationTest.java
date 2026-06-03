package com.mindrift.leaderboard;

import com.mindrift.BaseIntegrationTest;
import com.mindrift.leaderboard.dto.QuizScoredEvent;
import com.mindrift.leaderboard.entity.AchievementType;
import com.mindrift.leaderboard.repository.LeaderboardEntryRepository;
import com.mindrift.leaderboard.repository.UserAchievementRepository;
import com.mindrift.leaderboard.service.AchievementService;
import com.mindrift.leaderboard.service.LeaderboardRedisService;
import com.mindrift.leaderboard.service.LeaderboardService;
import com.mindrift.user.entity.User;
import com.mindrift.user.repository.UserRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for the Leaderboard & Achievement Engine.
 *
 * Validates:
 *   1. Score updates land in Redis ZSET and the DB entry
 *   2. Rank lookup returns correct 1-based position
 *   3. Achievements are granted idempotently
 *   4. Global leaderboard response is correctly shaped
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class LeaderboardIntegrationTest extends BaseIntegrationTest {

    @Autowired private LeaderboardService leaderboardService;
    @Autowired private LeaderboardRedisService redis;
    @Autowired private AchievementService achievementService;
    @Autowired private LeaderboardEntryRepository entryRepo;
    @Autowired private UserAchievementRepository achievementRepo;
    @Autowired private UserRepository userRepo;

    private static User testUser;
    private static UUID testUserId;

    @BeforeEach
    void setupUser() {
        if (testUser == null) {
            testUser = new User();
            testUser.setClerkId("clerk_test_" + UUID.randomUUID());
            testUser.setEmail("test-" + UUID.randomUUID() + "@mindrift.test");
            testUser.setUsername("testplayer");
            testUser.setFirstName("Test");
            testUser.setLastName("Player");
            testUser = userRepo.save(testUser);
            testUserId = testUser.getId();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Score update tests
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @Order(1)
    void processQuizScored_shouldUpdateRedisAndDb() {
        QuizScoredEvent event = QuizScoredEvent.builder()
                .userId(testUserId)
                .quizId(UUID.randomUUID())
                .categoryId(null)
                .score(85.0)
                .maxScore(100.0)
                .percentage(85.0)
                .passed(true)
                .perfectScore(false)
                .timeTakenSeconds(300L)
                .attemptNumber(1L)
                .build();

        leaderboardService.processQuizScored(event);

        // Verify Redis ZSET
        var globalScore = redis.getGlobalScore(testUserId);
        assertThat(globalScore).isPresent();
        assertThat(globalScore.getAsDouble()).isEqualTo(85.0);

        // Verify DB entry
        var dbEntry = entryRepo.findByUserIdAndCategoryIdIsNullAndSeasonIdIsNull(testUserId);
        assertThat(dbEntry).isPresent();
        assertThat(dbEntry.get().getTotalScore()).isEqualTo(85.0);
        assertThat(dbEntry.get().getTotalAttempts()).isEqualTo(1L);
    }

    @Test
    @Order(2)
    void processQuizScored_secondAttempt_shouldAccumulateScore() {
        QuizScoredEvent event = QuizScoredEvent.builder()
                .userId(testUserId)
                .quizId(UUID.randomUUID())
                .score(50.0)
                .maxScore(100.0)
                .percentage(50.0)
                .passed(false)
                .perfectScore(false)
                .timeTakenSeconds(600L)
                .attemptNumber(2L)
                .build();

        leaderboardService.processQuizScored(event);

        var dbEntry = entryRepo.findByUserIdAndCategoryIdIsNullAndSeasonIdIsNull(testUserId);
        assertThat(dbEntry).isPresent();
        assertThat(dbEntry.get().getTotalScore()).isEqualTo(135.0); // 85 + 50
        assertThat(dbEntry.get().getTotalAttempts()).isEqualTo(2L);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Rank tests
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @Order(3)
    void getGlobalRank_shouldReturnPositiveRank() {
        var rank = redis.getGlobalRank(testUserId);
        assertThat(rank).isPresent();
        assertThat(rank.getAsInt()).isGreaterThan(0);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Achievement tests
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @Order(4)
    @Transactional
    void achievement_firstQuiz_shouldBeGranted() {
        boolean hasFirstQuiz = achievementRepo.existsByUserIdAndAchievementType(
                testUserId, AchievementType.FIRST_QUIZ);
        assertThat(hasFirstQuiz).isTrue();
    }

    @Test
    @Order(5)
    void achievement_perfectScore_shouldBeGrantedWhenScoreIs100() {
        QuizScoredEvent event = QuizScoredEvent.builder()
                .userId(testUserId)
                .quizId(UUID.randomUUID())
                .score(100.0)
                .maxScore(100.0)
                .percentage(100.0)
                .passed(true)
                .perfectScore(true)
                .timeTakenSeconds(120L)
                .attemptNumber(3L)
                .build();

        leaderboardService.processQuizScored(event);

        boolean hasPerfect = achievementRepo.existsByUserIdAndAchievementType(
                testUserId, AchievementType.PERFECT_SCORE);
        assertThat(hasPerfect).isTrue();
    }

    @Test
    @Order(6)
    void achievement_idempotency_duplicateGrantShouldNotThrow() {
        // Calling evaluateAfterAttempt twice must not throw or create duplicate records
        Assertions.assertDoesNotThrow(() ->
            achievementService.evaluateAfterAttempt(testUser, 3L, true, 1L)
        );
        long count = achievementRepo.findByUserIdOrderByEarnedAtDesc(testUserId).stream()
                .filter(a -> a.getAchievementType() == AchievementType.PERFECT_SCORE)
                .count();
        assertThat(count).isEqualTo(1L); // Still only one
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Leaderboard response shape tests
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @Order(7)
    void getGlobal_shouldReturnNonEmptyEntries() {
        var response = leaderboardService.getGlobal(testUserId);
        assertThat(response).isNotNull();
        assertThat(response.getScope()).isEqualTo("GLOBAL");
        assertThat(response.getEntries()).isNotEmpty();
        assertThat(response.getMyRank()).isNotNull();
        assertThat(response.getTotalParticipants()).isGreaterThan(0);
    }

    @Test
    @Order(8)
    void getGlobal_anonymousRequest_shouldHaveNullMyRank() {
        var response = leaderboardService.getGlobal(null);
        assertThat(response.getMyRank()).isNull();
    }
}
