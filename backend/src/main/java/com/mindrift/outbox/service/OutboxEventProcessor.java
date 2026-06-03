package com.mindrift.outbox.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindrift.common.monitoring.MonitoringService;
import com.mindrift.outbox.entity.OutboxEvent;
import com.mindrift.outbox.repository.OutboxRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class OutboxEventProcessor {

    private final OutboxRepository outboxRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final MonitoringService monitoringService;

    private static final int MAX_RETRIES = 5;

    @Transactional
    public void processEvent(OutboxEvent event, String topic) {
        try {
            String key = event.getAggregateId();
            String data = objectMapper.writeValueAsString(event.getPayload());

            // Synchronous publish blocks until ACK confirm checks complete
            kafkaTemplate.send(topic, key, data).get();
            monitoringService.incrementKafkaPublish(topic, "SUCCESS");

            event.setStatus("COMPLETED");
            event.setProcessedAt(Instant.now());
            event.setLastError(null);
            outboxRepository.save(event);
            log.debug("Outbox record {} processed and published successfully to: {}", event.getId(), topic);
        } catch (Exception e) {
            log.error("Outbox process failure for event {}: {}", event.getId(), e.getMessage());
            int retries = event.getRetryCount() + 1;
            event.setRetryCount(retries);
            event.setLastError(e.getClass().getSimpleName() + ": " + e.getMessage());
            
            monitoringService.recordRetryAttempt("outbox_publisher");
            monitoringService.incrementKafkaPublish(topic, "FAILURE");

            if (retries >= MAX_RETRIES) {
                event.setStatus("FAILED");
                log.error("Outbox event {} marked as FAILED after {} retries", event.getId(), MAX_RETRIES);
            }
            outboxRepository.save(event);
        }
    }
}
