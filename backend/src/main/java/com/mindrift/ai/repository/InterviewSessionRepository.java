package com.mindrift.ai.repository;

import com.mindrift.ai.entity.InterviewSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface InterviewSessionRepository extends JpaRepository<InterviewSession, UUID> {
    Page<InterviewSession> findByUserIdOrderByStartedAtDesc(UUID userId, Pageable pageable);
}
