package com.mindrift.analytics.repository;

import com.mindrift.analytics.entity.SkillAnalytics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SkillAnalyticsRepository extends JpaRepository<SkillAnalytics, UUID> {

    Optional<SkillAnalytics> findByUserIdAndCategoryId(UUID userId, UUID categoryId);

    List<SkillAnalytics> findByUserIdOrderByMasteryScoreDesc(UUID userId);

    List<SkillAnalytics> findByUserIdAndSkillLevel(UUID userId, String skillLevel);
}
