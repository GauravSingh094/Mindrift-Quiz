package com.mindrift.leaderboard.repository;

import com.mindrift.leaderboard.entity.AchievementType;
import com.mindrift.leaderboard.entity.UserAchievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserAchievementRepository extends JpaRepository<UserAchievement, UUID> {

    List<UserAchievement> findByUserIdOrderByEarnedAtDesc(UUID userId);

    boolean existsByUserIdAndAchievementType(UUID userId, AchievementType type);

    Optional<UserAchievement> findByUserIdAndAchievementType(UUID userId, AchievementType type);

    long countByUserId(UUID userId);
}
