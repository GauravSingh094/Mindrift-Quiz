package com.mindrift.ai.repository;

import com.mindrift.ai.entity.LearningPath;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LearningPathRepository extends JpaRepository<LearningPath, UUID> {
    List<LearningPath> findByUserIdAndStatusOrderByCreatedAtDesc(UUID userId, String status);
    Page<LearningPath> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
}
