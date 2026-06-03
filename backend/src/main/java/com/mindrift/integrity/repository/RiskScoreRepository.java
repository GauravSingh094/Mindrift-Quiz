package com.mindrift.integrity.repository;

import com.mindrift.integrity.entity.RiskLevel;
import com.mindrift.integrity.entity.RiskScore;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RiskScoreRepository extends JpaRepository<RiskScore, UUID> {

    Optional<RiskScore> findByAttemptId(UUID attemptId);

    List<RiskScore> findByUserIdOrderByCreatedAtDesc(UUID userId);

    Page<RiskScore> findByRiskLevelInOrderByRiskScoreDesc(
        List<RiskLevel> levels, Pageable pageable);

    /** All attempts needing auto-action that haven't been processed yet */
    @Query("""
        SELECT r FROM RiskScore r
        WHERE r.riskLevel IN ('HIGH', 'CRITICAL')
          AND r.autoActionTaken = false
        ORDER BY r.riskScore DESC
        """)
    List<RiskScore> findPendingAutoActions();

    /** Average risk score across all attempts for a user */
    @Query("""
        SELECT AVG(r.riskScore) FROM RiskScore r
        WHERE r.user.id = :userId
        """)
    Double averageRiskScoreForUser(@Param("userId") UUID userId);
}
