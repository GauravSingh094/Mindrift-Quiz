package com.mindrift.quiz.event;

import com.mindrift.quiz.entity.QuizAttempt;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Publishes attempt lifecycle events to Kafka topic: quiz-events.
 * All sends are fire-and-forget with structured logging — failures are non-fatal.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AttemptEventPublisher {

    private static final String TOPIC = "quiz-events";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishAttemptStarted(QuizAttempt attempt) {
        AttemptStartedEvent event = AttemptStartedEvent.builder()
                .attemptId(attempt.getId())
                .userId(attempt.getUser().getId())
                .quizId(attempt.getQuiz().getId())
                .attemptNumber(attempt.getAttemptNumber())
                .startTime(attempt.getStartTime())
                .endTime(attempt.getEndTime())
                .occurredAt(Instant.now())
                .build();
        sendSafe(attempt.getId().toString(), event, "ATTEMPT_STARTED");
    }

    public void publishAnswerSubmitted(UUID attemptId, UUID userId, UUID quizId, UUID questionId,
                                       List<String> selectedOptionIds,
                                       double pointsEarned, double maxPoints, String scoreType) {
        AnswerSubmittedEvent event = AnswerSubmittedEvent.builder()
                .attemptId(attemptId)
                .userId(userId)
                .quizId(quizId)
                .questionId(questionId)
                .selectedOptionIds(selectedOptionIds)
                .pointsEarned(pointsEarned)
                .maxPoints(maxPoints)
                .scoreType(scoreType)
                .occurredAt(Instant.now())
                .build();
        sendSafe(attemptId.toString(), event, "ANSWER_SUBMITTED");
    }

    public void publishAttemptFinalised(QuizAttempt attempt, String eventType) {
        AttemptFinalisedEvent event = AttemptFinalisedEvent.builder()
                .eventType(eventType)
                .attemptId(attempt.getId())
                .userId(attempt.getUser().getId())
                .quizId(attempt.getQuiz().getId())
                .score(attempt.getScore())
                .maxScore(attempt.getMaxScore())
                .percentage(attempt.getPercentage() != null ? attempt.getPercentage() : 0.0)
                .passed(attempt.getPassed() != null && attempt.getPassed())
                .correctCount(attempt.getCorrectCount())
                .incorrectCount(attempt.getIncorrectCount())
                .unansweredCount(attempt.getUnansweredCount())
                .timeTakenSeconds(attempt.getTimeTakenSeconds() != null ? attempt.getTimeTakenSeconds() : 0L)
                .attemptNumber(attempt.getAttemptNumber())
                .occurredAt(Instant.now())
                .build();
        sendSafe(attempt.getId().toString(), event, eventType);
    }

    private void sendSafe(String key, Object event, String eventType) {
        kafkaTemplate.send(TOPIC, key, event)
                .whenComplete((result, ex) -> {
                    if (ex == null) {
                        log.debug("Published {} event to Kafka: key={}, offset={}",
                                eventType, key, result.getRecordMetadata().offset());
                    } else {
                        log.error("Failed to publish {} event to Kafka: key={}", eventType, key, ex);
                    }
                });
    }
}
