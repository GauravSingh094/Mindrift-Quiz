package com.mindrift.quiz.entity;

import com.mindrift.common.base.BaseEntity;
import com.mindrift.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Where;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Getter
@Setter
@Entity
@Table(name = "quizzes")
@Where(clause = "deleted_at IS NULL")
public class Quiz extends BaseEntity {

    @Column(nullable = false, length = 150)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id", nullable = false)
    private User creator;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private QuizDifficulty difficulty = QuizDifficulty.MEDIUM;

    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private QuizStatus status = QuizStatus.DRAFT;

    @Column(name = "estimated_duration", nullable = false)
    private Integer estimatedDuration = 15;

    @Column(name = "passing_score", nullable = false)
    private Double passingScore = 70.0;

    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private QuizVisibility visibility = QuizVisibility.PUBLIC;

    /** Monotonically increasing domain version (distinct from BaseEntity.version for OCC) */
    @Column(name = "quiz_version", nullable = false)
    private Integer quizVersion = 1;

    /** Soft-delete timestamp; NULL = active */
    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "published_at")
    private Instant publishedAt;

    @Column(name = "archived_at")
    private Instant archivedAt;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "quizzes_tags_map",
        joinColumns = @JoinColumn(name = "quiz_id"),
        inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    private Set<Tag> tags = new HashSet<>();

    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("orderIndex ASC")
    private List<Question> questions = new ArrayList<>();

    /** Convenience: returns true when quiz is logically deleted */
    public boolean isDeleted() {
        return deletedAt != null;
    }
}
