package com.mindrift.analytics.repository;

import com.mindrift.analytics.entity.CompetitionAnalytics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CompetitionAnalyticsRepository extends JpaRepository<CompetitionAnalytics, UUID> {

    Optional<CompetitionAnalytics> findByCompetitionId(UUID competitionId);
}
