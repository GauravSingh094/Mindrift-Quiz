package com.mindrift.outbox.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindrift.outbox.entity.OutboxEvent;
import com.mindrift.outbox.repository.OutboxRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OutboxService {

    private final OutboxPublisherService outboxPublisherService;

    @Transactional
    public void saveEvent(String aggregateType, String aggregateId, String eventType, Object payload) {
        outboxPublisherService.publishEvent(aggregateType, aggregateId, eventType, payload);
    }
}
