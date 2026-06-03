package com.mindrift.ai.entity;

import com.mindrift.common.base.BaseEntity;
import com.mindrift.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/**
 * An AI-powered mock interview session.
 *
 * Each session covers one topic/role and consists of multiple turn-by-turn
 * exchanges (INTERVIEW_QUESTION → user answer → INTERVIEW_EVALUATION).
 * The final INTERVIEW_FEEDBACK request summarises the entire session.
 */
@Getter
@Setter
@Entity
@Table(
    name = "interview_sessions",
    indexes = {
        @Index(name = "idx_iv_user",    columnList = "user_id"),
        @Index(name = "idx_iv_status",  columnList = "status"),
        @Index(name = "idx_iv_started", columnList = "started_at DESC")
    }
)
public class InterviewSession extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // ─── Config ───────────────────────────────────────────────────────────
    @Column(name = "topic", nullable = false, length = 200)
    private String topic;

    @Column(name = "role_title", length = 100)
    private String roleTitle;      // e.g. "Senior Java Engineer"

    @Column(name = "experience_level", length = 30)
    private String experienceLevel; // JUNIOR | MID | SENIOR | LEAD

    @Column(name = "focus_areas_json", columnDefinition = "JSONB")
    private String focusAreasJson = "[]"; // e.g. ["Spring Boot","Microservices"]

    @Column(name = "total_questions")
    private Integer totalQuestions = 10;

    // ─── Progress ─────────────────────────────────────────────────────────
    @Column(name = "current_question")
    private Integer currentQuestion = 0;

    @Column(name = "questions_answered")
    private Integer questionsAnswered = 0;

    /** ACTIVE | COMPLETED | ABANDONED */
    @Column(name = "status", nullable = false, length = 20)
    private String status = "ACTIVE";

    // ─── Conversation ─────────────────────────────────────────────────────
    /**
     * Full conversation history as JSON array:
     * [{ role: "interviewer"|"candidate", content, timestamp, score?, feedback? }]
     */
    @Column(name = "conversation_json", columnDefinition = "JSONB", nullable = false)
    private String conversationJson = "[]";

    // ─── Results ──────────────────────────────────────────────────────────
    @Column(name = "overall_score")
    private Double overallScore;       // 0–100

    @Column(name = "technical_score")
    private Double technicalScore;

    @Column(name = "communication_score")
    private Double communicationScore;

    @Column(name = "problem_solving_score")
    private Double problemSolvingScore;

    @Column(name = "final_feedback", columnDefinition = "TEXT")
    private String finalFeedback;

    /** Strong areas identified (JSON array of strings) */
    @Column(name = "strengths_json", columnDefinition = "JSONB")
    private String strengthsJson = "[]";

    /** Areas for improvement (JSON array) */
    @Column(name = "improvements_json", columnDefinition = "JSONB")
    private String improvementsJson = "[]";

    // ─── Timing ───────────────────────────────────────────────────────────
    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;
}
