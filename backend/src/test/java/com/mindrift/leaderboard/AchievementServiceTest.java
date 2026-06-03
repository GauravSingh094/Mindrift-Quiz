package com.mindrift.leaderboard;

import com.mindrift.leaderboard.entity.AchievementType;
import com.mindrift.leaderboard.entity.UserAchievement;
import com.mindrift.leaderboard.repository.UserAchievementRepository;
import com.mindrift.leaderboard.service.AchievementService;
import com.mindrift.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AchievementService — uses Mockito to avoid DB/Kafka.
 */
@ExtendWith(MockitoExtension.class)
class AchievementServiceTest {

    @Mock private UserAchievementRepository achievementRepository;
    @Mock private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private AchievementService achievementService;

    private User user;

    @BeforeEach
    void setup() {
        user = new User();
        // Reflectively set the ID so equals() works
        try {
            var f = com.mindrift.common.base.BaseEntity.class.getDeclaredField("id");
            f.setAccessible(true);
            f.set(user, UUID.randomUUID());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        user.setEmail("unit@test.com");
        user.setUsername("unituser");
    }

    // ─── FIRST_QUIZ ──────────────────────────────────────────────────────────

    @Test
    void evaluateAfterAttempt_firstAttempt_grantsFirstQuizBadge() {
        when(achievementRepository.existsByUserIdAndAchievementType(any(), any())).thenReturn(false);

        achievementService.evaluateAfterAttempt(user, 1L, false, 0L);

        ArgumentCaptor<UserAchievement> captor = ArgumentCaptor.forClass(UserAchievement.class);
        verify(achievementRepository, atLeastOnce()).save(captor.capture());

        boolean firstQuizGranted = captor.getAllValues().stream()
                .anyMatch(a -> a.getAchievementType() == AchievementType.FIRST_QUIZ);
        assertThat(firstQuizGranted).isTrue();
    }

    // ─── Idempotency ─────────────────────────────────────────────────────────

    @Test
    void evaluateAfterAttempt_alreadyGranted_doesNotSaveAgain() {
        // All achievements already exist
        when(achievementRepository.existsByUserIdAndAchievementType(any(), any())).thenReturn(true);

        achievementService.evaluateAfterAttempt(user, 1L, false, 0L);

        verify(achievementRepository, never()).save(any());
    }

    // ─── 100 QUIZZES ─────────────────────────────────────────────────────────

    @Test
    void evaluateAfterAttempt_100Quizzes_grantsCenturyScholar() {
        when(achievementRepository.existsByUserIdAndAchievementType(any(), any())).thenReturn(false);

        achievementService.evaluateAfterAttempt(user, 100L, false, 0L);

        ArgumentCaptor<UserAchievement> captor = ArgumentCaptor.forClass(UserAchievement.class);
        verify(achievementRepository, atLeastOnce()).save(captor.capture());

        boolean centuryGranted = captor.getAllValues().stream()
                .anyMatch(a -> a.getAchievementType() == AchievementType.QUIZZES_100);
        assertThat(centuryGranted).isTrue();
    }

    // ─── PERFECT_SCORE ───────────────────────────────────────────────────────

    @Test
    void evaluateAfterAttempt_perfectScore_grantsPerfectBadge() {
        when(achievementRepository.existsByUserIdAndAchievementType(any(), any())).thenReturn(false);

        achievementService.evaluateAfterAttempt(user, 1L, true, 1L);

        ArgumentCaptor<UserAchievement> captor = ArgumentCaptor.forClass(UserAchievement.class);
        verify(achievementRepository, atLeastOnce()).save(captor.capture());

        boolean perfectGranted = captor.getAllValues().stream()
                .anyMatch(a -> a.getAchievementType() == AchievementType.PERFECT_SCORE);
        assertThat(perfectGranted).isTrue();
    }

    // ─── TOP_10_GLOBAL ───────────────────────────────────────────────────────

    @Test
    void evaluateAfterRankUpdate_rank5_grantsTop10Badge() {
        when(achievementRepository.existsByUserIdAndAchievementType(any(), any())).thenReturn(false);

        achievementService.evaluateAfterRankUpdate(user, 5);

        ArgumentCaptor<UserAchievement> captor = ArgumentCaptor.forClass(UserAchievement.class);
        verify(achievementRepository, atLeastOnce()).save(captor.capture());

        boolean top10Granted = captor.getAllValues().stream()
                .anyMatch(a -> a.getAchievementType() == AchievementType.TOP_10_GLOBAL);
        assertThat(top10Granted).isTrue();
    }

    @Test
    void evaluateAfterRankUpdate_rank15_doesNotGrantTop10() {
        when(achievementRepository.existsByUserIdAndAchievementType(any(), any())).thenReturn(false);

        achievementService.evaluateAfterRankUpdate(user, 15);

        verify(achievementRepository, never()).save(any());
    }

    // ─── FIRST_WIN ───────────────────────────────────────────────────────────

    @Test
    void evaluateAfterCompetitionWin_firstWin_grantsBothBadges() {
        when(achievementRepository.existsByUserIdAndAchievementType(any(), any())).thenReturn(false);

        achievementService.evaluateAfterCompetitionWin(user, UUID.randomUUID(), true);

        ArgumentCaptor<UserAchievement> captor = ArgumentCaptor.forClass(UserAchievement.class);
        verify(achievementRepository, times(2)).save(captor.capture()); // COMPETITION_WINNER + FIRST_WIN

        assertThat(captor.getAllValues()).extracting(UserAchievement::getAchievementType)
                .contains(AchievementType.COMPETITION_WINNER, AchievementType.FIRST_WIN);
    }

    // ─── Event publishing ────────────────────────────────────────────────────

    @Test
    void evaluateAfterAttempt_newAchievement_publishesEvent() {
        when(achievementRepository.existsByUserIdAndAchievementType(any(), any())).thenReturn(false);

        achievementService.evaluateAfterAttempt(user, 1L, false, 0L);

        verify(eventPublisher, atLeastOnce()).publishEvent(any(AchievementService.AchievementGrantedEvent.class));
    }
}
