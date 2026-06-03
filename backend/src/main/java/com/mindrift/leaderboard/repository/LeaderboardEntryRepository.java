package com.mindrift.leaderboard.repository;

import com.mindrift.leaderboard.entity.LeaderboardEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LeaderboardEntryRepository extends JpaRepository<LeaderboardEntry, UUID> {

    // ─── Global (no category, no season) ────────────────────────────────────

    Optional<LeaderboardEntry> findByUserIdAndCategoryIdIsNullAndSeasonIdIsNull(UUID userId);

    /** Ordered by total_score DESC – used to seed Redis on startup (Join-Fetched to prevent N+1 select loop) */
    @Query("SELECT e FROM LeaderboardEntry e JOIN FETCH e.user WHERE e.categoryId IS NULL AND e.seasonId IS NULL ORDER BY e.totalScore DESC")
    List<LeaderboardEntry> findByCategoryIdIsNullAndSeasonIdIsNullOrderByTotalScoreDesc();

    // ─── Category ────────────────────────────────────────────────────────────

    Optional<LeaderboardEntry> findByUserIdAndCategoryIdAndSeasonIdIsNull(UUID userId, UUID categoryId);

    List<LeaderboardEntry> findByCategoryIdAndSeasonIdIsNullOrderByTotalScoreDesc(UUID categoryId);

    // ─── Season ──────────────────────────────────────────────────────────────

    Optional<LeaderboardEntry> findByUserIdAndCategoryIdIsNullAndSeasonId(UUID userId, UUID seasonId);

    List<LeaderboardEntry> findBySeasonIdAndCategoryIdIsNullOrderByTotalScoreDesc(UUID seasonId);

    // ─── Rank Update ─────────────────────────────────────────────────────────

    @Modifying
    @Query("""
        UPDATE LeaderboardEntry e
           SET e.currentRank = :rank,
               e.bestRank    = CASE WHEN (e.bestRank IS NULL OR e.bestRank > :rank) THEN :rank ELSE e.bestRank END
         WHERE e.id = :id
        """)
    void updateRank(@Param("id") UUID id, @Param("rank") int rank);

    // ─── Stats for achievements ───────────────────────────────────────────────

    @Query("""
        SELECT COALESCE(SUM(e.totalAttempts), 0)
          FROM LeaderboardEntry e
         WHERE e.user.id = :userId AND e.categoryId IS NULL AND e.seasonId IS NULL
        """)
    long totalAttemptsForUser(@Param("userId") UUID userId);
}
