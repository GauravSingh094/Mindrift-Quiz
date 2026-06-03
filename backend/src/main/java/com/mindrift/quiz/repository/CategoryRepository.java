package com.mindrift.quiz.repository;

import com.mindrift.quiz.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CategoryRepository extends JpaRepository<Category, UUID> {

    Optional<Category> findBySlug(String slug);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, UUID id);

    // Top-level categories (no parent)
    List<Category> findByParentIsNull();

    // Sub-categories of a given parent
    List<Category> findByParentId(UUID parentId);

    // Count quizzes in a category (non-deleted)
    @Query("SELECT COUNT(q) FROM Quiz q WHERE q.category.id = :categoryId AND q.deletedAt IS NULL")
    long countQuizzesByCategoryId(@Param("categoryId") UUID categoryId);
}
