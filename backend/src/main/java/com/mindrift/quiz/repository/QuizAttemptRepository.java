package com.mindrift.quiz.repository;

import com.mindrift.quiz.entity.QuizAttempt;
import com.mindrift.quiz.entity.QuizAttemptStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, UUID> {

    List<QuizAttempt> findByUserIdAndQuizId(UUID userId, UUID quizId);

    Optional<QuizAttempt> findFirstByUserIdAndQuizIdOrderByAttemptNumberDesc(UUID userId, UUID quizId);

    long countByUserIdAndQuizIdAndStatus(UUID userId, UUID quizId, QuizAttemptStatus status);

    Page<QuizAttempt> findByUserId(UUID userId, Pageable pageable);

    Page<QuizAttempt> findByQuizId(UUID quizId, Pageable pageable);

    /** Find active attempts that have exceeded their timer — used by the expiry scheduler */
    @Query("""
            SELECT a FROM QuizAttempt a
            WHERE a.status IN ('STARTED', 'IN_PROGRESS')
            AND a.endTime < :now
            """)
    List<QuizAttempt> findExpiredActiveAttempts(@Param("now") Instant now);

    /** Idempotency check: does a SUBMITTED attempt exist for this key? */
    Optional<QuizAttempt> findByIdempotencyKey(String idempotencyKey);

    /** Best score per user per quiz */
    @Query("""
            SELECT MAX(a.score) FROM QuizAttempt a
            WHERE a.user.id = :userId AND a.quiz.id = :quizId
            AND a.status = 'SUBMITTED'
            """)
    Optional<Double> findBestScoreByUserAndQuiz(@Param("userId") UUID userId, @Param("quizId") UUID quizId);

    /** Check for already-active (non-expired) attempt for this user+quiz */
    @Query("""
            SELECT a FROM QuizAttempt a
            WHERE a.user.id = :userId AND a.quiz.id = :quizId
            AND a.status IN ('STARTED', 'IN_PROGRESS')
            AND a.endTime > :now
            """)
    Optional<QuizAttempt> findActiveAttempt(@Param("userId") UUID userId,
                                             @Param("quizId") UUID quizId,
                                             @Param("now") Instant now);

    /** Count all submitted attempts for analytics */
    long countByQuizIdAndStatus(UUID quizId, QuizAttemptStatus status);
}
