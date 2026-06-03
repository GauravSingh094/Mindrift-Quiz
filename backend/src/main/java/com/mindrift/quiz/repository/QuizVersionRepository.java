package com.mindrift.quiz.repository;

import com.mindrift.quiz.entity.QuizVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QuizVersionRepository extends JpaRepository<QuizVersion, UUID> {

    Optional<QuizVersion> findFirstByQuizIdOrderByVersionDesc(UUID quizId);

    Optional<QuizVersion> findByQuizIdAndVersion(UUID quizId, Integer version);

    List<QuizVersion> findByQuizIdOrderByVersionDesc(UUID quizId);

    @Query("SELECT COUNT(v) FROM QuizVersion v WHERE v.quiz.id = :quizId")
    long countByQuizId(@Param("quizId") UUID quizId);
}
