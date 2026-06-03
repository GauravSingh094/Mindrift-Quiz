package com.mindrift.leaderboard.service;

import com.mindrift.leaderboard.dto.QuizScoredEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Kafka consumer that listens on the "quiz-scored" topic.
 *
 * When a quiz attempt is scored by the QuizAttemptService, it publishes a
 * QuizScoredEvent to this topic. This consumer forwards it to the LeaderboardService
 * so leaderboard updates are decoupled from the scoring transaction.
 *
 * Consumer group: "leaderboard-group"
 * Concurrency: configured via application.yml (default: 3 threads)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LeaderboardEventConsumer {

    private final LeaderboardService leaderboardService;

    @KafkaListener(
        topics   = "${mindrift.kafka.topics.quiz-scored:quiz-scored}",
        groupId  = "leaderboard-group",
        containerFactory = "quizScoredListenerContainerFactory"
    )
    public void onQuizScored(QuizScoredEvent event) {
        log.info("Received quiz-scored event — user={} score={}", event.getUserId(), event.getScore());
        try {
            leaderboardService.processQuizScored(event);
        } catch (Exception ex) {
            log.error("Error processing quiz-scored event for user={}: {}", event.getUserId(), ex.getMessage(), ex);
            // Dead-letter handling is managed by the KafkaConfig error handler
            throw ex;
        }
    }
}
