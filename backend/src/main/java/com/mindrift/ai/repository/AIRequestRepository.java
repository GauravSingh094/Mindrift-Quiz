package com.mindrift.ai.repository;

import com.mindrift.ai.entity.AIProvider;
import com.mindrift.ai.entity.AIRequest;
import com.mindrift.ai.entity.AIRequestType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AIRequestRepository extends JpaRepository<AIRequest, UUID> {

    Page<AIRequest> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    Optional<AIRequest> findByJobId(String jobId);

    /** Count tokens used by a user in a given time window (for quota enforcement) */
    @Query("""
        SELECT COALESCE(SUM(r.totalTokens), 0) FROM AIRequest r
        WHERE r.user.id = :userId
          AND r.createdAt >= :since
          AND r.status = 'COMPLETED'
        """)
    long sumTokensForUser(@Param("userId") UUID userId, @Param("since") Instant since);

    /** Provider performance: average latency per provider over last N hours */
    @Query("""
        SELECT r.provider, AVG(r.latencyMs) FROM AIRequest r
        WHERE r.createdAt >= :since
          AND r.status = 'COMPLETED'
        GROUP BY r.provider
        """)
    List<Object[]> avgLatencyByProvider(@Param("since") Instant since);

    /** Cache hit lookup by prompt hash and request type */
    @Query("""
        SELECT r FROM AIRequest r
        WHERE r.promptHash = :hash
          AND r.requestType = :type
          AND r.status = 'COMPLETED'
        ORDER BY r.createdAt DESC
        """)
    List<AIRequest> findByPromptHashAndType(@Param("hash") String hash,
                                            @Param("type") AIRequestType type,
                                            Pageable pageable);
}
