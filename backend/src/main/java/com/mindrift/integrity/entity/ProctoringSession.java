package com.mindrift.integrity.entity;

import com.mindrift.common.base.BaseEntity;
import com.mindrift.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Proctoring session for a monitored quiz attempt.
 *
 * Created when a quiz or competition requires proctoring.
 * Tracks camera / mic consent, connection heartbeats, and frame analysis results.
 */
@Getter
@Setter
@Entity
@Table(
    name = "proctoring_sessions",
    indexes = {
        @Index(name = "idx_proc_attempt", columnList = "attempt_id", unique = true),
        @Index(name = "idx_proc_user",    columnList = "user_id"),
        @Index(name = "idx_proc_status",  columnList = "status")
    }
)
public class ProctoringSession extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "attempt_id", nullable = false, unique = true)
    private UUID attemptId;

    @Column(name = "competition_id")
    private UUID competitionId;

    // ─── Status ───────────────────────────────────────────────────────────
    /** ACTIVE | COMPLETED | DISCONNECTED | FLAGGED | TERMINATED */
    @Column(name = "status", nullable = false, length = 20)
    private String status = "ACTIVE";

    // ─── Consent / setup ─────────────────────────────────────────────────
    @Column(name = "camera_consented",    nullable = false)
    private Boolean cameraConsented = false;

    @Column(name = "microphone_consented", nullable = false)
    private Boolean microphoneConsented = false;

    @Column(name = "screen_share_consented", nullable = false)
    private Boolean screenShareConsented = false;

    @Column(name = "fullscreen_required",  nullable = false)
    private Boolean fullscreenRequired = false;

    // ─── Connection ───────────────────────────────────────────────────────
    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @Column(name = "last_heartbeat_at")
    private Instant lastHeartbeatAt;

    @Column(name = "heartbeat_missed_count", nullable = false)
    private Integer heartbeatMissedCount = 0;

    // ─── Frame analysis summary ───────────────────────────────────────────
    @Column(name = "frames_captured",     nullable = false)
    private Long framesCaptured = 0L;

    @Column(name = "face_detected_frames", nullable = false)
    private Long faceDetectedFrames = 0L;

    @Column(name = "no_face_frames",      nullable = false)
    private Long noFaceFrames = 0L;

    @Column(name = "multiple_face_frames", nullable = false)
    private Long multipleFaceFrames = 0L;

    /** Computed face detection rate 0–100 */
    @Column(name = "face_detection_rate", nullable = false)
    private Double faceDetectionRate = 100.0;

    // ─── Network ─────────────────────────────────────────────────────────
    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    // ─── Flags ────────────────────────────────────────────────────────────
    /** Whether this session was flagged for human review */
    @Column(name = "flagged_for_review", nullable = false)
    private Boolean flaggedForReview = false;

    @Column(name = "flag_reason", columnDefinition = "TEXT")
    private String flagReason;
}
