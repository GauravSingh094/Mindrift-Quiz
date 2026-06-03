package com.mindrift.outbox.repository;

import com.mindrift.outbox.entity.OutboxEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface OutboxRepository extends JpaRepository<OutboxEvent, UUID>, JpaSpecificationExecutor<OutboxEvent> {
    List<OutboxEvent> findTop100ByStatusOrderByCreatedAtAsc(String status);
    long countByStatus(String status);
}
