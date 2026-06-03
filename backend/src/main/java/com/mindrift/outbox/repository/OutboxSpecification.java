package com.mindrift.outbox.repository;

import com.mindrift.outbox.entity.OutboxEvent;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;

public class OutboxSpecification {

    public static Specification<OutboxEvent> hasStatus(String status) {
        return (root, query, cb) -> status == null ? null : cb.equal(root.get("status"), status);
    }

    public static Specification<OutboxEvent> hasAggregateType(String aggregateType) {
        return (root, query, cb) -> aggregateType == null ? null : cb.equal(root.get("aggregateType"), aggregateType);
    }

    public static Specification<OutboxEvent> createdBefore(Instant time) {
        return (root, query, cb) -> time == null ? null : cb.lessThanOrEqualTo(root.get("createdAt"), time);
    }
}
