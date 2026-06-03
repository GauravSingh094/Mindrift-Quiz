package com.mindrift.quiz.repository;

import com.mindrift.quiz.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TagRepository extends JpaRepository<Tag, UUID> {

    Optional<Tag> findByName(String name);

    boolean existsByName(String name);

    boolean existsByNameAndIdNot(String name, UUID id);

    List<Tag> findByNameContainingIgnoreCase(String keyword);

    // Count quizzes using this tag (non-deleted)
    @Query("SELECT COUNT(q) FROM Quiz q JOIN q.tags t WHERE t.id = :tagId AND q.deletedAt IS NULL")
    long countQuizzesByTagId(@Param("tagId") UUID tagId);
}
