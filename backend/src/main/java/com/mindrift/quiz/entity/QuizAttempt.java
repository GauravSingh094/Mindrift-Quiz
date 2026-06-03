package com.mindrift.quiz.entity;

import com.mindrift.common.base.BaseEntity;
import com.mindrift.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents a single quiz attempt by a user.
 * Stores full lifecycle state: STARTED → IN_PROGRESS → SUBMITTED | EXPIRED | CANCELLED.
 * The idempotencyKey prevents duplicate submissions under concurrent requests.
 */
@Getter
@Setter
@Entity
@Table(name = "quiz_attempts")
public class QuizAttempt extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private QuizAttemptStatus status = QuizAttemptStatus.STARTED;

    @Column(name = "start_time", nullable = false)
    private Instant startTime;

    /** Hard deadline computed from quiz.estimatedDuration */
    @Column(name = "end_time", nullable = false)
    private Instant endTime;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    /** Raw score earned */
    @Column(nullable = false)
    private Double score = 0.0;

    /** Maximum possible score for this attempt's quiz */
    @Column(name = "max_score", nullable = false)
    private Double maxScore = 0.0;

    /** Percentage: (score / maxScore) * 100 */
    @Column
    private Double percentage;

    @Column
    private Boolean passed;

    @Column(name = "correct_count", nullable = false)
    private Integer correctCount = 0;

    @Column(name = "incorrect_count", nullable = false)
    private Integer incorrectCount = 0;

    @Column(name = "unanswered_count", nullable = false)
    private Integer unansweredCount = 0;

    @Column(name = "time_taken_seconds")
    private Long timeTakenSeconds;

    @Column(name = "attempt_number", nullable = false)
    private Integer attemptNumber;

    /** SHA-256 of (userId + quizId + timestamp) used for idempotent submission */
    @Column(name = "idempotency_key", unique = true)
    private String idempotencyKey;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @Column(name = "user_agent", length = 512)
    private String userAgent;

    @OneToMany(mappedBy = "attempt", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<QuestionResponse> responses = new ArrayList<>();
}
