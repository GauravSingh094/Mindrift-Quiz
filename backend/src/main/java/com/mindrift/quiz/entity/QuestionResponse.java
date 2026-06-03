package com.mindrift.quiz.entity;

import com.mindrift.common.base.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.List;

/**
 * Records the user's answer for a single question in a quiz attempt.
 * Scoring metadata (isCorrect, isPartial, scoreType) enables rich result breakdown.
 */
@Getter
@Setter
@Entity
@Table(name = "question_responses")
public class QuestionResponse extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", nullable = false)
    private QuizAttempt attempt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "selected_option_ids", nullable = false, columnDefinition = "jsonb")
    private List<String> selectedOptionIds;

    @Column(name = "points_earned", nullable = false)
    private Double pointsEarned = 0.0;

    @Column(name = "max_points", nullable = false)
    private Double maxPoints = 0.0;

    @Column(name = "is_correct", nullable = false)
    private Boolean isCorrect = false;

    @Column(name = "is_partial", nullable = false)
    private Boolean isPartial = false;

    /** CORRECT | INCORRECT | PARTIAL | NEGATIVE | UNANSWERED */
    @Column(name = "score_type", length = 50)
    private String scoreType;

    @Column(name = "answered_at", nullable = false)
    private Instant answeredAt = Instant.now();

    /** Time spent on this question in milliseconds (client-reported) */
    @Column(name = "time_spent_ms")
    private Long timeSpentMs;
}
