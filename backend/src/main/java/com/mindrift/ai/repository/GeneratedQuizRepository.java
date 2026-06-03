package com.mindrift.ai.repository;

import com.mindrift.ai.entity.GeneratedQuiz;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface GeneratedQuizRepository extends JpaRepository<GeneratedQuiz, UUID> {
    Page<GeneratedQuiz> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
    Page<GeneratedQuiz> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);
}
