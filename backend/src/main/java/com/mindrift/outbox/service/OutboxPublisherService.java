package com.mindrift.outbox.service;

import com.mindrift.outbox.entity.OutboxEvent;
import com.mindrift.outbox.repository.OutboxRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class OutboxPublisherService {

    private final OutboxRepository outboxRepository;

    @Transactional(propagation = Propagation.MANDATORY)
    public void publishEvent(String aggregateType, String aggregateId, String eventType, Object payload) {
        log.debug("OutboxPublisher persisting event: '{}' for aggregate: '{}/{}'", eventType, aggregateType, aggregateId);
        
        OutboxEvent event = new OutboxEvent();
        event.setAggregateType(aggregateType);
        event.setAggregateId(aggregateId);
        event.setEventType(eventType);
        event.setPayload(payload);
        event.setStatus("PENDING");
        event.setRetryCount(0);
        event.setCreatedAt(Instant.now());
        
        outboxRepository.save(event);
        log.debug("Successfully persisted outbox event {} in active transaction", event.getId());
    }
}
