package com.mindrift.analytics.repository;

import com.mindrift.analytics.entity.UserAnalytics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserAnalyticsRepository extends JpaRepository<UserAnalytics, UUID> {

    Optional<UserAnalytics> findByUserId(UUID userId);

    /** Top N users by total score for platform-wide leaderboard alignment */
    @Query("""
        SELECT u FROM UserAnalytics u
        ORDER BY u.totalScore DESC
        LIMIT :n
        """)
    java.util.List<UserAnalytics> findTopN(@Param("n") int n);

    @Modifying
    @Query("""
        UPDATE UserAnalytics u
           SET u.currentStreakDays = CASE
                WHEN u.lastActiveAt >= :yesterday THEN u.currentStreakDays + 1
                ELSE 1
               END,
               u.longestStreakDays = GREATEST(u.longestStreakDays,
                   CASE WHEN u.lastActiveAt >= :yesterday THEN u.currentStreakDays + 1 ELSE 1 END),
               u.lastActiveAt = :now
         WHERE u.user.id = :userId
        """)
    void updateStreak(@Param("userId") UUID userId,
                      @Param("yesterday") Instant yesterday,
                      @Param("now") Instant now);

    @Query("SELECT COALESCE(SUM(u.totalAttempts), 0) FROM UserAnalytics u")
    long sumTotalAttempts();

    @Query("SELECT COALESCE(AVG(u.averageScore), 0.0) FROM UserAnalytics u")
    double averageScorePlatform();

    @Query("SELECT COALESCE(AVG(CASE WHEN u.submittedAttempts > 0 THEN (u.passedAttempts * 100.0 / u.submittedAttempts) ELSE 0.0 END), 0.0) FROM UserAnalytics u")
    double averagePassRatePlatform();
}
