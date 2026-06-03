package com.mindrift.leaderboard.repository;

import com.mindrift.leaderboard.entity.LeaderboardSeason;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LeaderboardSeasonRepository extends JpaRepository<LeaderboardSeason, UUID> {

    Optional<LeaderboardSeason> findByIsActiveTrue();

    /** Find season that contains the given timestamp */
    Optional<LeaderboardSeason> findByStartDateBeforeAndEndDateAfter(Instant ref1, Instant ref2);
}
