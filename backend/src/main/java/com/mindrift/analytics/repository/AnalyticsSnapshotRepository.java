package com.mindrift.analytics.repository;

import com.mindrift.analytics.entity.AnalyticsSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface AnalyticsSnapshotRepository extends JpaRepository<AnalyticsSnapshot, UUID> {

    /** Last N snapshots for a subject, descending (for sparkline charts) */
    List<AnalyticsSnapshot> findBySubjectIdAndSubjectTypeAndGranularityOrderBySnapshotAtDesc(
        UUID subjectId, String subjectType, String granularity);

    /** Snapshots within a time window */
    @Query("""
        SELECT s FROM AnalyticsSnapshot s
        WHERE s.subjectId = :subjectId
          AND s.subjectType = :subjectType
          AND s.granularity = :granularity
          AND s.snapshotAt BETWEEN :from AND :to
        ORDER BY s.snapshotAt ASC
        """)
    List<AnalyticsSnapshot> findInRange(
        @Param("subjectId")    UUID subjectId,
        @Param("subjectType")  String subjectType,
        @Param("granularity")  String granularity,
        @Param("from")         Instant from,
        @Param("to")           Instant to
    );

    /** Delete old hourly snapshots older than 7 days to keep table lean */
    @org.springframework.data.jpa.repository.Modifying
    @Query("""
        DELETE FROM AnalyticsSnapshot s
        WHERE s.granularity = 'HOURLY'
          AND s.snapshotAt < :cutoff
        """)
    void purgeOldHourlySnapshots(@Param("cutoff") Instant cutoff);

    /** Bulk insert hourly user snapshots directly in DB to prevent JVM OutOfMemory */
    @org.springframework.data.jpa.repository.Modifying
    @Query(value = """
        INSERT INTO analytics_snapshots (id, subject_id, subject_type, snapshot_at, period_label, granularity, total_attempts, total_score, average_score, pass_rate, unique_users, metrics_json, created_at, updated_at, created_by, updated_by, version)
        SELECT gen_random_uuid(), ua.user_id, 'USER', :now, :label, 'HOURLY', ua.total_attempts, ua.total_score, ua.average_score,
               CASE WHEN ua.submitted_attempts > 0 THEN ROUND((ua.passed_attempts::numeric / ua.submitted_attempts::numeric) * 100, 2) ELSE 0.0 END, 1,
               CAST(CONCAT('{"totalAttempts":', ua.total_attempts, ',"passedAttempts":', ua.passed_attempts, ',"accuracyRate":', ua.accuracy_rate, ',"streakDays":', ua.current_streak_days, '}') AS jsonb),
               :now, :now, 'SYSTEM', 'SYSTEM', 1
        FROM user_analytics ua
        """, nativeQuery = true)
    void writeHourlyUserSnapshotsBulk(@Param("now") Instant now, @Param("label") String label);
}
