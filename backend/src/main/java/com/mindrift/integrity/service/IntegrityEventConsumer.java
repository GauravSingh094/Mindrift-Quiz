package com.mindrift.integrity.service;

import com.mindrift.integrity.repository.RiskScoreRepository;
import com.mindrift.integrity.entity.RiskScore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Kafka consumer for the quiz-events topic.
 *
 * On ATTEMPT_FINALISED events, triggers generateReport() so every
 * completed attempt has an integrity report, even with 0 violations.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class IntegrityEventConsumer {

    private final IntegrityService integrityService;
    private final RiskScoreRepository riskScoreRepository;

    @KafkaListener(
        topics           = "quiz-events",
        groupId          = "integrity-group",
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void onQuizEvent(String rawPayload) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper =
                    new com.fasterxml.jackson.databind.ObjectMapper()
                            .registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());

            com.fasterxml.jackson.databind.JsonNode node = mapper.readTree(rawPayload);
            String eventType = node.path("eventType").asText();

            if (!"ATTEMPT_SUBMITTED".equals(eventType) && !"ATTEMPT_EXPIRED".equals(eventType)) {
                return;
            }

            java.util.UUID attemptId = java.util.UUID.fromString(node.path("attemptId").asText());
            java.util.UUID userId    = java.util.UUID.fromString(node.path("userId").asText());

            // Generate integrity report for this completed attempt
            integrityService.generateReport(attemptId, userId);

            // Also process any pending auto-actions
            processPendingAutoActions();

        } catch (Exception ex) {
            log.error("Error in integrity event consumer: {}", ex.getMessage(), ex);
        }
    }

    /** Processes any high/critical risk scores that haven't had auto-actions applied yet. */
    private void processPendingAutoActions() {
        List<RiskScore> pending = riskScoreRepository.findPendingAutoActions();
        for (RiskScore rs : pending) {
            log.warn("Processing pending auto-action for attempt={} level={}",
                    rs.getAttemptId(), rs.getRiskLevel());
            // Re-record a server violation to trigger auto-action
            integrityService.recordServerViolation(
                    rs.getAttemptId(), rs.getUser().getId(),
                    com.mindrift.integrity.entity.ViolationType.MULTIPLE_SESSIONS,
                    "Pending auto-action triggered for risk level " + rs.getRiskLevel(),
                    null);
        }
    }
}
