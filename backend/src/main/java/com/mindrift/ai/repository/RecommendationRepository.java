package com.mindrift.ai.repository;

import com.mindrift.ai.entity.Recommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface RecommendationRepository extends JpaRepository<Recommendation, UUID> {

    /** Active (non-expired) recommendations for a user */
    @Query("""
        SELECT r FROM Recommendation r
        WHERE r.user.id = :userId
          AND (r.expiresAt IS NULL OR r.expiresAt > :now)
        ORDER BY r.createdAt DESC
        """)
    List<Recommendation> findActiveByUserId(@Param("userId") UUID userId,
                                            @Param("now") Instant now);

    List<Recommendation> findByUserIdAndRecommendationTypeOrderByCreatedAtDesc(
            UUID userId, String type);
}
