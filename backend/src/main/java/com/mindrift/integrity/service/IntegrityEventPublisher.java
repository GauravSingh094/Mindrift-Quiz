package com.mindrift.integrity.service;

import com.mindrift.integrity.dto.IntegrityViolationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

/**
 * Kafka producer for the integrity-events topic.
 * Fire-and-forget with structured logging.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class IntegrityEventPublisher {

    @Value("${mindrift.kafka.topics.integrity-events:integrity-events}")
    private String topic;

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publish(IntegrityViolationEvent event) {
        String key = event.getAttemptId() != null ? event.getAttemptId().toString()
                   : event.getUserId() != null ? event.getUserId().toString() : "system";

        kafkaTemplate.send(topic, key, event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish integrity event type={}: {}",
                                event.getEventType(), ex.getMessage());
                    } else {
                        log.debug("Published integrity event type={} partition={} offset={}",
                                event.getEventType(),
                                result.getRecordMetadata().partition(),
                                result.getRecordMetadata().offset());
                    }
                });
    }
}
