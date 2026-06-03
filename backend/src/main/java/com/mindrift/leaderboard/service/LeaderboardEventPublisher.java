package com.mindrift.leaderboard.service;

import com.mindrift.leaderboard.dto.QuizScoredEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

/**
 * Publishes quiz-scored events to Kafka so the leaderboard consumer
 * can process them asynchronously (decoupled from the scoring transaction).
 *
 * Called by QuizAttemptService after a successful attempt submission.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LeaderboardEventPublisher {

    @Value("${mindrift.kafka.topics.quiz-scored:quiz-scored}")
    private String topic;

    private final KafkaTemplate<String, QuizScoredEvent> kafkaTemplate;

    /**
     * Publishes the event. The key is userId so all events for the same user
     * land on the same partition (ordering guarantee per user).
     */
    public void publish(QuizScoredEvent event) {
        CompletableFuture<SendResult<String, QuizScoredEvent>> future =
                kafkaTemplate.send(topic, event.getUserId().toString(), event);

        future.whenComplete((result, ex) -> {
            if (ex != null) {
                log.error("Failed to publish quiz-scored event for user={}: {}", event.getUserId(), ex.getMessage());
            } else {
                log.debug("Published quiz-scored event — user={} topic={} partition={} offset={}",
                        event.getUserId(), topic,
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset());
            }
        });
    }
}
