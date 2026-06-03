package com.mindrift.quiz.repository;

import com.mindrift.quiz.entity.Quiz;
import com.mindrift.quiz.entity.QuizStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, UUID>, JpaSpecificationExecutor<Quiz> {

    // Find including soft-deleted (for admin recovery)
    @Query("SELECT q FROM Quiz q WHERE q.id = :id")
    Optional<Quiz> findByIdIncludingDeleted(@Param("id") UUID id);

    // Count published quizzes per category
    long countByCategoryIdAndStatus(UUID categoryId, QuizStatus status);

    // Count quizzes per creator
    long countByCreatorId(UUID creatorId);

    // Find all by creator with pagination
    Page<Quiz> findByCreatorId(UUID creatorId, Pageable pageable);

    // Soft-delete: sets deletedAt instead of removing row
    @Modifying
    @Query("UPDATE Quiz q SET q.deletedAt = :deletedAt WHERE q.id = :id")
    void softDeleteById(@Param("id") UUID id, @Param("deletedAt") Instant deletedAt);

    // Check if slug-like title exists for deduplication
    boolean existsByTitleAndCreatorIdAndDeletedAtIsNull(String title, UUID creatorId);
}
