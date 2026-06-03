package com.mindrift.integrity.repository;

import com.mindrift.integrity.entity.IntegrityReport;
import com.mindrift.integrity.entity.RiskLevel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface IntegrityReportRepository extends JpaRepository<IntegrityReport, UUID> {

    Optional<IntegrityReport> findByAttemptId(UUID attemptId);

    Page<IntegrityReport> findByUserIdOrderByGeneratedAtDesc(UUID userId, Pageable pageable);

    Page<IntegrityReport> findByModerationStatusOrderByGeneratedAtDesc(
        String moderationStatus, Pageable pageable);

    Page<IntegrityReport> findByRiskLevelInOrderByRiskScoreDesc(
        java.util.List<RiskLevel> levels, Pageable pageable);

    /** Count of pending (unreviewed) reports requiring moderator action */
    @Query("""
        SELECT COUNT(r) FROM IntegrityReport r
        WHERE r.moderationStatus = 'PENDING'
          AND r.riskLevel IN ('MEDIUM', 'HIGH', 'CRITICAL')
        """)
    long countPendingModeration();

    /** Reports for a competition */
    @Query("""
        SELECT r FROM IntegrityReport r
        WHERE r.competitionId = :competitionId
        ORDER BY r.riskScore DESC
        """)
    Page<IntegrityReport> findByCompetitionId(
        @Param("competitionId") UUID competitionId, Pageable pageable);
}
