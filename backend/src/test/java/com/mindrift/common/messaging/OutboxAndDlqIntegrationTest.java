package com.mindrift.common.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindrift.BaseIntegrationTest;
import com.mindrift.common.base.DeadLetterEvent;
import com.mindrift.common.base.DeadLetterRepository;
import com.mindrift.common.monitoring.MonitoringService;
import com.mindrift.outbox.entity.OutboxEvent;
import com.mindrift.outbox.repository.OutboxRepository;
import com.mindrift.outbox.service.OutboxProcessorScheduler;
import com.mindrift.outbox.service.OutboxPublisherService;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class OutboxAndDlqIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private OutboxRepository outboxRepository;

    @Autowired
    private DeadLetterRepository deadLetterRepository;

    @Autowired
    private OutboxPublisherHelper outboxPublisherHelper;

    @Autowired
    private OutboxProcessorScheduler outboxProcessorScheduler;

    @Autowired
    private DeadLetterConsumer deadLetterConsumer;

    @Autowired
    private MonitoringService monitoringService;

    @Autowired
    private ObjectMapper objectMapper;

    @TestConfiguration
    static class OutboxTestConfig {
        @Bean
        public OutboxPublisherHelper outboxPublisherHelper(OutboxPublisherService outboxPublisherService) {
            return new OutboxPublisherHelper(outboxPublisherService);
        }
    }

    @Service
    public static class OutboxPublisherHelper {
        private final OutboxPublisherService outboxPublisherService;

        public OutboxPublisherHelper(OutboxPublisherService outboxPublisherService) {
            this.outboxPublisherService = outboxPublisherService;
        }

        @Transactional
        public void doPublish(String aggregateType, String aggregateId, String eventType, Object payload) {
            outboxPublisherService.publishEvent(aggregateType, aggregateId, eventType, payload);
        }
    }

    @BeforeEach
    void setUp() {
        outboxRepository.deleteAll();
        deadLetterRepository.deleteAll();
    }

    @Test
    void testTransactionalOutboxPublishAndExecution() throws Exception {
        Map<String, String> payload = new HashMap<>();
        payload.put("quizId", "123");
        payload.put("title", "Spring Boot Reliability");

        // 1. Publish outbox event inside transactional helper
        outboxPublisherHelper.doPublish("QUIZ", "quiz_123", "quiz:create", payload);

        // Assert it is persisted with PENDING state
        List<OutboxEvent> outboxList = outboxRepository.findAll();
        assertEquals(1, outboxList.size());
        OutboxEvent initialEvent = outboxList.get(0);
        assertEquals("PENDING", initialEvent.getStatus());
        assertEquals("quiz_123", initialEvent.getAggregateId());
        assertEquals(0, initialEvent.getRetryCount());

        // 2. Execute Scheduler Polling
        outboxProcessorScheduler.processPendingEvents();

        // Assert outbox event transitioned to COMPLETED
        OutboxEvent processedEvent = outboxRepository.findById(initialEvent.getId()).orElseThrow();
        assertEquals("COMPLETED", processedEvent.getStatus());
        assertNotNull(processedEvent.getProcessedAt());
        assertNull(processedEvent.getLastError());
    }

    @Test
    void testOutboxFailureIncrementsRetryCount() {
        // Publish outbox event with a broken payload to force Jackson serialization error in scheduler
        OutboxEvent brokenEvent = new OutboxEvent();
        brokenEvent.setAggregateType("QUIZ");
        brokenEvent.setAggregateId("quiz_broken");
        brokenEvent.setEventType("quiz:create");
        // Self-referencing map causes jackson serialization loop exception
        Map<String, Object> circularMap = new HashMap<>();
        circularMap.put("self", circularMap);
        brokenEvent.setPayload(circularMap);
        brokenEvent.setStatus("PENDING");
        brokenEvent.setRetryCount(0);
        brokenEvent.setCreatedAt(Instant.now());
        outboxRepository.save(brokenEvent);

        // Run Outbox Processor
        outboxProcessorScheduler.processPendingEvents();

        // Verify outbox retry count is incremented and error is recorded
        OutboxEvent failedEvent = outboxRepository.findById(brokenEvent.getId()).orElseThrow();
        assertEquals("PENDING", failedEvent.getStatus());
        assertEquals(1, failedEvent.getRetryCount());
        assertNotNull(failedEvent.getLastError());
        assertTrue(failedEvent.getLastError().contains("JsonMappingException") || failedEvent.getLastError().contains("JsonGenerationException"));
    }

    @Test
    void testDeadLetterConsumerStoresPoisonMessage() {
        String poisonPayload = "{invalid-json-payload}";
        ConsumerRecord<String, String> record = new ConsumerRecord<>("quiz-events-dlq", 0, 100L, "quiz_key", poisonPayload);
        
        // Simulating consumer failure routed x-exception message headers
        record.headers().add("x-exception-message", "DeserializationException: Invalid token".getBytes());
        record.headers().add("x-exception-stacktrace", "Stacktrace snippet...".getBytes());

        // Trigger DLQ Consumer manually
        deadLetterConsumer.consumeDlq(record, "quiz-events-dlq", 0, 100L);

        // Assert DLQ Event is written to the database
        List<DeadLetterEvent> dlqEvents = deadLetterRepository.findAll();
        assertEquals(1, dlqEvents.size());
        DeadLetterEvent dlqEvent = dlqEvents.get(0);
        assertEquals("quiz-events-dlq", dlqEvent.getTopic());
        assertEquals(poisonPayload, dlqEvent.getPayload());
        assertEquals("DeserializationException: Invalid token", dlqEvent.getFailureReason());
        assertEquals("Stacktrace snippet...", dlqEvent.getStackTrace());
        assertNotNull(dlqEvent.getCreatedAt());
    }
}
