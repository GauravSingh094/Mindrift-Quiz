package com.mindrift.integrity.repository;

import com.mindrift.integrity.entity.RiskLevel;
import com.mindrift.integrity.entity.ViolationEvent;
import com.mindrift.integrity.entity.ViolationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface ViolationEventRepository extends JpaRepository<ViolationEvent, UUID> {

    List<ViolationEvent> findByAttemptIdOrderByOccurredAtAsc(UUID attemptId);

    Page<ViolationEvent> findByUserIdOrderByOccurredAtDesc(UUID userId, Pageable pageable);

    long countByAttemptId(UUID attemptId);

    long countByAttemptIdAndViolationType(UUID attemptId, ViolationType type);

    /** All unreviewed HIGH/CRITICAL violations for moderator queue */
    @Query("""
        SELECT v FROM ViolationEvent v
        WHERE v.riskLevel IN ('HIGH', 'CRITICAL')
          AND v.reviewed = false
        ORDER BY v.occurredAt DESC
        """)
    Page<ViolationEvent> findPendingModerationQueue(Pageable pageable);

    /** Violation frequency per type for a given attempt */
    @Query("""
        SELECT v.violationType, COUNT(v) FROM ViolationEvent v
        WHERE v.attemptId = :attemptId
        GROUP BY v.violationType
        """)
    List<Object[]> countByTypeForAttempt(@Param("attemptId") UUID attemptId);

    /** Detect burst: more than :threshold violations in :windowSeconds */
    @Query("""
        SELECT COUNT(v) FROM ViolationEvent v
        WHERE v.attemptId    = :attemptId
          AND v.occurredAt  >= :windowStart
        """)
    long countRecentViolations(@Param("attemptId") UUID attemptId,
                               @Param("windowStart") Instant windowStart);

    /** For platform-level cheat report: users with >= minViolations */
    @Query("""
        SELECT v.user.id, COUNT(v)
        FROM ViolationEvent v
        WHERE v.occurredAt >= :since
        GROUP BY v.user.id
        HAVING COUNT(v) >= :minViolations
        ORDER BY COUNT(v) DESC
        """)
    List<Object[]> findHighViolationUsers(@Param("since") Instant since,
                                          @Param("minViolations") long minViolations);
}
