package com.mindrift.leaderboard.service;

import com.mindrift.leaderboard.dto.AchievementDto;
import com.mindrift.leaderboard.dto.UserAchievementsResponse;
import com.mindrift.leaderboard.entity.AchievementType;
import com.mindrift.leaderboard.entity.UserAchievement;
import com.mindrift.leaderboard.repository.UserAchievementRepository;
import com.mindrift.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * AchievementService — evaluates and grants achievements idempotently.
 *
 * Achievements are granted at key lifecycle events:
 *   • After a quiz attempt is scored
 *   • After a leaderboard rank is computed
 *   • After a competition concludes
 *
 * Idempotency is guaranteed by the DB unique constraint on (user_id, achievement_type).
 * Spring ApplicationEvents are published so the notification module can send push/email.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AchievementService {

    private final UserAchievementRepository achievementRepository;
    private final ApplicationEventPublisher eventPublisher;

    // ─────────────────────────────────────────────────────────────────────────
    //  EVALUATION ENTRY POINTS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Called after every scored quiz attempt.
     *
     * @param user          the user who submitted the attempt
     * @param totalAttempts total all-time attempts (global leaderboard entry)
     * @param perfectScore  true if percentage == 100
     * @param totalPerfects total number of perfect scores ever
     */
    @Transactional
    public void evaluateAfterAttempt(User user,
                                     long totalAttempts,
                                     boolean perfectScore,
                                     long totalPerfects) {

        // Milestone achievements
        grantIfNew(user, AchievementType.FIRST_QUIZ, "first quiz completed");

        if (totalAttempts >= 10)  grantIfNew(user, AchievementType.QUIZZES_10,  "10 quizzes");
        if (totalAttempts >= 50)  grantIfNew(user, AchievementType.QUIZZES_50,  "50 quizzes");
        if (totalAttempts >= 100) grantIfNew(user, AchievementType.QUIZZES_100, "100 quizzes");
        if (totalAttempts >= 500) grantIfNew(user, AchievementType.QUIZZES_500, "500 quizzes");

        // Perfect-score achievements
        if (perfectScore) {
            grantIfNew(user, AchievementType.PERFECT_SCORE, "perfect score");
        }
        if (totalPerfects >= 5)  grantIfNew(user, AchievementType.PERFECT_SCORE_5,  "5 perfects");
        if (totalPerfects >= 25) grantIfNew(user, AchievementType.PERFECT_SCORE_25, "25 perfects");
    }

    /**
     * Called after the global leaderboard rank is recomputed for a user.
     *
     * @param user        the user
     * @param globalRank  current 1-based rank (null if unranked)
     */
    @Transactional
    public void evaluateAfterRankUpdate(User user, Integer globalRank) {
        if (globalRank == null) return;
        if (globalRank <= 10) grantIfNew(user, AchievementType.TOP_10_GLOBAL, "global top 10");
        if (globalRank <= 3)  grantIfNew(user, AchievementType.TOP_3_GLOBAL,  "global top 3");
        if (globalRank == 1)  grantIfNew(user, AchievementType.RANK_1_GLOBAL, "global rank 1");
    }

    /**
     * Called when a competition concludes with a winner.
     *
     * @param winner        the winning user
     * @param competitionId context reference
     * @param isFirstWin    whether this is the user's very first competition win
     */
    @Transactional
    public void evaluateAfterCompetitionWin(User winner, UUID competitionId, boolean isFirstWin) {
        String ctx = "competition:" + competitionId;
        grantIfNew(winner, AchievementType.COMPETITION_WINNER, ctx);
        if (isFirstWin) {
            grantIfNew(winner, AchievementType.FIRST_WIN, ctx);
        }
    }

    /**
     * Called when a season ends and winner is determined.
     */
    @Transactional
    public void evaluateAfterSeasonEnd(User winner, UUID seasonId) {
        grantIfNew(winner, AchievementType.SEASON_WINNER, "season:" + seasonId);
    }

    /**
     * Grants a streak achievement if the user's current streak meets the threshold.
     */
    @Transactional
    public void evaluateStreak(User user, int streakDays) {
        if (streakDays >= 7)  grantIfNew(user, AchievementType.STREAK_7,  "7-day streak");
        if (streakDays >= 30) grantIfNew(user, AchievementType.STREAK_30, "30-day streak");
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  QUERY
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public UserAchievementsResponse getAchievements(User user) {
        List<UserAchievement> raw = achievementRepository.findByUserIdOrderByEarnedAtDesc(user.getId());
        List<AchievementDto> dtos = raw.stream().map(this::toDto).toList();
        return UserAchievementsResponse.builder()
                .userId(user.getId().toString())
                .username(user.getUsername())
                .totalAchievements(dtos.size())
                .achievements(dtos)
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Idempotent grant: if the achievement already exists, do nothing.
     * If new, persist and publish an event for notifications.
     */
    private void grantIfNew(User user, AchievementType type, String context) {
        if (achievementRepository.existsByUserIdAndAchievementType(user.getId(), type)) {
            return; // Already awarded — skip silently
        }
        UserAchievement achievement = new UserAchievement();
        achievement.setUser(user);
        achievement.setAchievementType(type);
        achievement.setEarnedAt(Instant.now());
        achievement.setContext(context);
        achievementRepository.save(achievement);

        log.info("Achievement GRANTED — user={} type={}", user.getId(), type);

        // Publish event so NotificationService can fire push/email
        eventPublisher.publishEvent(new AchievementGrantedEvent(this, user, type));
    }

    private AchievementDto toDto(UserAchievement a) {
        return AchievementDto.builder()
                .id(a.getId())
                .type(a.getAchievementType())
                .displayName(a.getAchievementType().displayName)
                .description(a.getAchievementType().description)
                .earnedAt(a.getEarnedAt())
                .context(a.getContext())
                .iconKey(a.getAchievementType().name().toLowerCase())
                .build();
    }

    // ─── Inner event class ───────────────────────────────────────────────────

    public static class AchievementGrantedEvent extends org.springframework.context.ApplicationEvent {
        public final User user;
        public final AchievementType type;

        public AchievementGrantedEvent(Object source, User user, AchievementType type) {
            super(source);
            this.user = user;
            this.type = type;
        }
    }
}
