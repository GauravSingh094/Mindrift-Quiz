package com.mindrift.integrity.repository;

import com.mindrift.integrity.entity.ProctoringSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProctoringSessionRepository extends JpaRepository<ProctoringSession, UUID> {

    Optional<ProctoringSession> findByAttemptId(UUID attemptId);

    boolean existsByAttemptId(UUID attemptId);
}
