package com.mindrift.outbox.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindrift.common.monitoring.MonitoringService;
import com.mindrift.outbox.entity.OutboxEvent;
import com.mindrift.outbox.repository.OutboxRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * Transactional Outbox processor polling loop.
 * Publishes events to Kafka and manages delivery status, retries, and monitoring metrics.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OutboxProcessorScheduler {

    private final OutboxRepository outboxRepository;
    private final OutboxEventProcessor outboxEventProcessor;
    private final MonitoringService monitoringService;

    @Scheduled(fixedDelay = 1000)
    public void processPendingEvents() {
        // Report current outbox backlog count to metrics
        long backlog = outboxRepository.countByStatus("PENDING");
        monitoringService.setOutboxBacklog(backlog);

        List<OutboxEvent> pendingEvents = outboxRepository.findTop100ByStatusOrderByCreatedAtAsc("PENDING");
        if (pendingEvents.isEmpty()) {
            return;
        }

        log.debug("OutboxProcessor running. Processing {} pending outbox records.", pendingEvents.size());
        for (OutboxEvent event : pendingEvents) {
            String topic = selectTopic(event.getAggregateType());
            outboxEventProcessor.processEvent(event, topic);
        }
    }

    private String selectTopic(String aggregateType) {
        if (aggregateType == null) {
            return "quiz-events";
        }
        return switch (aggregateType.toUpperCase()) {
            case "QUIZ", "QUESTION", "ATTEMPT":
                yield "quiz-events";
            case "COMPETITION":
                yield "competition-events";
            case "NOTIFICATION":
                yield "notification-events";
            case "ANALYTICS":
                yield "analytics-events";
            case "LEADERBOARD":
                yield "leaderboard-events";
            case "AUDIT":
                yield "audit-events";
            case "AI":
                yield "ai-events";
            default:
                yield "quiz-events";
        };
    }
}
