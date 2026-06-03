package com.mindrift.common.messaging;

import com.mindrift.common.base.DeadLetterEvent;
import com.mindrift.common.base.DeadLetterRepository;
import com.mindrift.common.monitoring.MonitoringService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.time.Instant;

/**
 * Enterprise Dead Letter Queue (DLQ) consumer.
 * Listens to all dead-letter topics, persists poison messages, and updates observability counters.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DeadLetterConsumer {

    private final DeadLetterRepository deadLetterRepository;
    private final MonitoringService monitoringService;

    @KafkaListener(topics = {
            "quiz-events-dlq",
            "competition-events-dlq",
            "notification-events-dlq",
            "analytics-events-dlq"
    }, groupId = "mindrift-dlq-group")
    public void consumeDlq(
            ConsumerRecord<String, String> record,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset) {
        
        log.error("POISON MESSAGE CAPTURED ON DLQ topic: {}, partition: {}, offset: {}", topic, partition, offset);
        try {
            DeadLetterEvent event = new DeadLetterEvent();
            event.setTopic(topic);
            event.setPartitionId(partition);
            event.setOffsetId(offset);
            event.setKeyValue(record.key());
            event.setPayload(record.value());
            
            String reason = "Poison message routed to Dead Letter Queue";
            String trace = "None";
            
            if (record.headers() != null) {
                var exceptionHeader = record.headers().lastHeader("x-exception-message");
                if (exceptionHeader != null) {
                    reason = new String(exceptionHeader.value());
                }
                var stackHeader = record.headers().lastHeader("x-exception-stacktrace");
                if (stackHeader != null) {
                    trace = new String(stackHeader.value());
                }
            }

            event.setFailureReason(reason);
            event.setStackTrace(trace);
            event.setCreatedAt(Instant.now());

            deadLetterRepository.save(event);
            
            // Update DLQ backlog metric
            long totalDlqSize = deadLetterRepository.count();
            monitoringService.setDlqSize(totalDlqSize);
            
            log.info("Dead letter event record successfully stored in database: {}", event.getId());
        } catch (Exception e) {
            log.error("Failed to persist dead letter event record in database", e);
        }
    }
}
