package com.mindrift.analytics.entity;

import com.mindrift.common.base.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Aggregated analytics for a single competition.
 *
 * Created when a competition concludes. Provides organiser-level insight
 * into engagement, participation, and score distribution.
 */
@Getter
@Setter
@Entity
@Table(
    name = "competition_analytics",
    indexes = {
        @Index(name = "idx_ca_competition", columnList = "competition_id"),
        @Index(name = "idx_ca_ended_at",    columnList = "ended_at DESC")
    }
)
public class CompetitionAnalytics extends BaseEntity {

    @Column(name = "competition_id", nullable = false, unique = true)
    private UUID competitionId;

    @Column(name = "competition_title", length = 200)
    private String competitionTitle;

    @Column(name = "organizer_id")
    private UUID organizerId;

    @Column(name = "quiz_id")
    private UUID quizId;

    // ─── Participation ──────────────────────────────────────────────────────
    @Column(name = "registered_count", nullable = false)
    private Long registeredCount = 0L;

    @Column(name = "active_count", nullable = false)
    private Long activeCount = 0L;

    @Column(name = "completed_count", nullable = false)
    private Long completedCount = 0L;

    @Column(name = "disqualified_count", nullable = false)
    private Long disqualifiedCount = 0L;

    @Column(name = "dropout_rate", nullable = false)
    private Double dropoutRate = 0.0;

    // ─── Score stats ────────────────────────────────────────────────────────
    @Column(name = "average_score", nullable = false)
    private Double averageScore = 0.0;

    @Column(name = "highest_score", nullable = false)
    private Double highestScore = 0.0;

    @Column(name = "lowest_score", nullable = false)
    private Double lowestScore = 0.0;

    @Column(name = "median_score")
    private Double medianScore;

    @Column(name = "pass_rate", nullable = false)
    private Double passRate = 0.0;

    // ─── Top players (JSON) ─────────────────────────────────────────────────
    /** JSON array of top-3: [{"userId":"…","score":95.0,"rank":1}, …] */
    @Column(name = "top3_json", columnDefinition = "JSONB")
    private String top3Json = "[]";

    // ─── Timing ─────────────────────────────────────────────────────────────
    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    // ─── Engagement ─────────────────────────────────────────────────────────
    @Column(name = "average_completion_seconds", nullable = false)
    private Long averageCompletionSeconds = 0L;

    @Column(name = "total_rounds", nullable = false)
    private Integer totalRounds = 1;

    @Column(name = "winner_user_id")
    private UUID winnerUserId;
}
