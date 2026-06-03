package com.mindrift.analytics.repository;

import com.mindrift.analytics.entity.QuizAnalytics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QuizAnalyticsRepository extends JpaRepository<QuizAnalytics, UUID> {

    Optional<QuizAnalytics> findByQuizId(UUID quizId);

    /** Top quizzes by total attempts for the "Popular Quizzes" widget */
    @Query("""
        SELECT q FROM QuizAnalytics q
        ORDER BY q.totalAttempts DESC
        LIMIT :n
        """)
    List<QuizAnalytics> findMostAttempted(@Param("n") int n);

    /** Quizzes created by a specific user (creator analytics) */
    @Query("""
        SELECT q FROM QuizAnalytics q
        WHERE q.quizId IN (
            SELECT qz.id FROM Quiz qz WHERE qz.creator.id = :creatorId
        )
        ORDER BY q.totalAttempts DESC
        """)
    List<QuizAnalytics> findByCreator(@Param("creatorId") UUID creatorId);
}
