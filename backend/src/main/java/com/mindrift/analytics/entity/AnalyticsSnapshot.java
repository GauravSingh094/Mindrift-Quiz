package com.mindrift.analytics.entity;

import com.mindrift.common.base.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Point-in-time snapshot of analytics for a user or quiz.
 *
 * Written by a scheduled aggregation job (every hour / every day).
 * Enables historical trend charts without re-scanning all attempts.
 */
@Getter
@Setter
@Entity
@Table(
    name = "analytics_snapshots",
    indexes = {
        @Index(name = "idx_snap_subject", columnList = "subject_id, subject_type"),
        @Index(name = "idx_snap_ts",      columnList = "snapshot_at DESC"),
        @Index(name = "idx_snap_period",  columnList = "subject_id, period_label")
    }
)
public class AnalyticsSnapshot extends BaseEntity {

    /** UUID of the user / quiz / competition being snapshotted */
    @Column(name = "subject_id", nullable = false)
    private UUID subjectId;

    /** USER | QUIZ | COMPETITION | PLATFORM */
    @Column(name = "subject_type", nullable = false, length = 20)
    private String subjectType;

    /** e.g. "2025-06-01T00:00:00Z" */
    @Column(name = "snapshot_at", nullable = false)
    private Instant snapshotAt;

    /** Human-readable period label: "2025-W22", "2025-06", "2025-Q2" */
    @Column(name = "period_label", length = 20)
    private String periodLabel;

    /** HOURLY | DAILY | WEEKLY | MONTHLY */
    @Column(name = "granularity", nullable = false, length = 20)
    private String granularity;

    // ─── Core metrics captured at snapshot time ─────────────────────────────
    @Column(name = "total_attempts", nullable = false)
    private Long totalAttempts = 0L;

    @Column(name = "total_score",    nullable = false)
    private Double totalScore = 0.0;

    @Column(name = "average_score",  nullable = false)
    private Double averageScore = 0.0;

    @Column(name = "pass_rate",      nullable = false)
    private Double passRate = 0.0;

    @Column(name = "unique_users",   nullable = false)
    private Long uniqueUsers = 0L;

    /** Full metrics JSON blob for flexibility — avoids schema migrations for new metrics */
    @Column(name = "metrics_json", columnDefinition = "JSONB")
    private String metricsJson = "{}";
}
