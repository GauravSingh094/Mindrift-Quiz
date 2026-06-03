package com.mindrift.quiz.repository;

import com.mindrift.quiz.entity.QuestionResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QuestionResponseRepository extends JpaRepository<QuestionResponse, UUID> {

    Optional<QuestionResponse> findByAttemptIdAndQuestionId(UUID attemptId, UUID questionId);

    List<QuestionResponse> findByAttemptId(UUID attemptId);

    @Query("SELECT SUM(r.pointsEarned) FROM QuestionResponse r WHERE r.attempt.id = :attemptId")
    Optional<Double> sumPointsEarnedByAttemptId(@Param("attemptId") UUID attemptId);

    long countByAttemptIdAndIsCorrect(UUID attemptId, Boolean isCorrect);

    long countByAttemptIdAndIsPartial(UUID attemptId, Boolean isPartial);
}
