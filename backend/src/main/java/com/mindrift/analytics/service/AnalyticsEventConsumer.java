package com.mindrift.analytics.service;

import com.mindrift.analytics.dto.AttemptFinalisedAnalyticsEvent;
import com.mindrift.quiz.entity.Quiz;
import com.mindrift.quiz.event.AttemptFinalisedEvent;
import com.mindrift.quiz.repository.QuizRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Kafka consumer for the quiz-events topic.
 *
 * Listens for ATTEMPT_FINALISED events and delegates analytics processing
 * to AnalyticsService. Uses the generic String consumer factory from KafkaConfig
 * because AttemptEventPublisher uses KafkaTemplate<String, Object>.
 *
 * The consumer enriches the raw event with resolved categoryId and difficulty
 * by doing a lightweight Quiz lookup before passing to AnalyticsService.
 *
 * Consumer group: analytics-group
 * Topic:          quiz-events
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AnalyticsEventConsumer {

    private final AnalyticsService analyticsService;
    private final QuizRepository   quizRepository;

    @KafkaListener(
        topics           = "quiz-events",
        groupId          = "analytics-group",
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void onQuizEvent(String rawPayload) {
        // The raw payload may be ATTEMPT_STARTED, ANSWER_SUBMITTED, or ATTEMPT_FINALISED.
        // We only act on finalised events; others are silently ignored.
        // Payload is parsed as a generic Map to avoid tight coupling.
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper =
                    new com.fasterxml.jackson.databind.ObjectMapper()
                            .registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());

            com.fasterxml.jackson.databind.JsonNode node = mapper.readTree(rawPayload);
            String eventType = node.path("eventType").asText();

            if (!"ATTEMPT_SUBMITTED".equals(eventType) && !"ATTEMPT_EXPIRED".equals(eventType)) {
                return; // Not a finalised event — skip
            }

            AttemptFinalisedAnalyticsEvent.AttemptFinalisedAnalyticsEventBuilder builder =
                AttemptFinalisedAnalyticsEvent.builder()
                    .eventType(eventType)
                    .attemptId(java.util.UUID.fromString(node.path("attemptId").asText()))
                    .userId(java.util.UUID.fromString(node.path("userId").asText()))
                    .quizId(java.util.UUID.fromString(node.path("quizId").asText()))
                    .score(node.path("score").asDouble())
                    .maxScore(node.path("maxScore").asDouble())
                    .percentage(node.path("percentage").asDouble())
                    .passed(node.path("passed").asBoolean())
                    .correctCount(node.path("correctCount").asInt())
                    .incorrectCount(node.path("incorrectCount").asInt())
                    .unansweredCount(node.path("unansweredCount").asInt())
                    .timeTakenSeconds(node.path("timeTakenSeconds").asLong())
                    .attemptNumber(node.path("attemptNumber").asInt())
                    .occurredAt(java.time.Instant.parse(node.path("occurredAt").asText()));

            // Enrich: resolve category + difficulty from Quiz record
            java.util.UUID quizId = java.util.UUID.fromString(node.path("quizId").asText());
            quizRepository.findById(quizId).ifPresent(quiz -> {
                if (quiz.getCategory() != null) {
                    builder.categoryId(quiz.getCategory().getId());
                }
                if (quiz.getDifficulty() != null) {
                    builder.difficulty(quiz.getDifficulty().name());
                }
            });

            analyticsService.processAttemptFinalised(builder.build());

        } catch (Exception ex) {
            log.error("Error processing quiz-events for analytics: {}", ex.getMessage(), ex);
            throw new RuntimeException(ex); // triggers Kafka retry / DLQ
        }
    }
}
