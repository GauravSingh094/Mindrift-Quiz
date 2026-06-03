package com.mindrift.ai.repository;

import com.mindrift.ai.entity.AIResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AIResponseRepository extends JpaRepository<AIResponse, UUID> {
    Optional<AIResponse> findByRequestId(UUID requestId);
}
