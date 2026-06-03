package com.mindrift.quiz.repository;

import com.mindrift.quiz.entity.Quiz;
import com.mindrift.quiz.entity.QuizDifficulty;
import com.mindrift.quiz.entity.QuizStatus;
import com.mindrift.quiz.entity.QuizVisibility;
import jakarta.persistence.criteria.Join;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

/**
 * JPA Specification builders for dynamic, composable Quiz filtering.
 * All specs implicitly respect the @Where(deleted_at IS NULL) on the Quiz entity.
 */
public class QuizSpecification {

    public static Specification<Quiz> hasCategory(UUID categoryId) {
        return (root, query, cb) -> categoryId == null ? null
                : cb.equal(root.get("category").get("id"), categoryId);
    }

    public static Specification<Quiz> hasDifficulty(QuizDifficulty difficulty) {
        return (root, query, cb) -> difficulty == null ? null
                : cb.equal(root.get("difficulty"), difficulty);
    }

    public static Specification<Quiz> hasStatus(QuizStatus status) {
        return (root, query, cb) -> status == null ? null
                : cb.equal(root.get("status"), status);
    }

    public static Specification<Quiz> hasVisibility(QuizVisibility visibility) {
        return (root, query, cb) -> visibility == null ? null
                : cb.equal(root.get("visibility"), visibility);
    }

    public static Specification<Quiz> hasCreator(UUID creatorId) {
        return (root, query, cb) -> creatorId == null ? null
                : cb.equal(root.get("creator").get("id"), creatorId);
    }

    public static Specification<Quiz> hasTag(String tag) {
        return (root, query, cb) -> {
            if (tag == null || tag.isBlank()) return null;
            // Distinct to avoid duplicates when joining on a collection
            query.distinct(true);
            Join<Object, Object> tagJoin = root.join("tags");
            return cb.equal(cb.lower(tagJoin.get("name")), tag.toLowerCase().trim());
        };
    }

    public static Specification<Quiz> searchTitleOrDescription(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.isBlank()) return null;
            String pattern = "%" + keyword.toLowerCase().trim() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("title")), pattern),
                    cb.like(cb.lower(root.get("description")), pattern)
            );
        };
    }

    /** Exclude soft-deleted records explicitly (backup safety besides @Where) */
    public static Specification<Quiz> notDeleted() {
        return (root, query, cb) -> cb.isNull(root.get("deletedAt"));
    }
}
