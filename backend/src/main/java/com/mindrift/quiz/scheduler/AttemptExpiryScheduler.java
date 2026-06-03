package com.mindrift.quiz.scheduler;

import com.mindrift.quiz.entity.QuizAttempt;
import com.mindrift.quiz.event.AttemptEventPublisher;
import com.mindrift.quiz.repository.QuizAttemptRepository;
import com.mindrift.quiz.repository.QuestionRepository;
import com.mindrift.quiz.repository.QuestionResponseRepository;
import com.mindrift.quiz.session.AttemptSessionService;
import com.mindrift.quiz.entity.Question;
import com.mindrift.quiz.entity.QuestionResponse;
import com.mindrift.quiz.entity.QuizAttemptStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Background scheduler that auto-expires overdue quiz attempts.
 * Runs every 60 seconds. Finds all STARTED/IN_PROGRESS attempts where
 * endTime < now and transitions them to EXPIRED, scoring whatever was saved.
 *
 * This provides timer enforcement even if the client disconnects or the
 * submit call is never made.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AttemptExpiryScheduler {

    private final QuizAttemptRepository quizAttemptRepository;
    private final QuestionRepository questionRepository;
    private final QuestionResponseRepository questionResponseRepository;
    private final AttemptSessionService sessionService;
    private final AttemptEventPublisher eventPublisher;

    @Scheduled(fixedDelay = 60_000)  // every 60 seconds
    @Transactional
    public void expireOverdueAttempts() {
        Instant now = Instant.now();
        List<QuizAttempt> expired = quizAttemptRepository.findExpiredActiveAttempts(now);

        if (!expired.isEmpty()) {
            log.info("AttemptExpiryScheduler: found {} overdue attempts to expire", expired.size());
        }

        for (QuizAttempt attempt : expired) {
            try {
                finaliseExpiredAttempt(attempt, now);
            } catch (Exception e) {
                log.error("Failed to expire attempt {}: {}", attempt.getId(), e.getMessage(), e);
            }
        }
    }

    private void finaliseExpiredAttempt(QuizAttempt attempt, Instant now) {
        log.info("Expiring attempt {} for user {} on quiz {}",
                attempt.getId(), attempt.getUser().getId(), attempt.getQuiz().getId());

        // Sum whatever responses exist in DB
        List<Question> questions = attempt.getQuiz().getQuestions();
        double maxScore = questions.stream().mapToDouble(q -> q.getPoints().doubleValue()).sum();

        double totalScore = 0.0;
        int correct = 0;
        int incorrect = 0;
        int unanswered = 0;

        for (Question q : questions) {
            Optional<QuestionResponse> respOpt =
                    questionResponseRepository.findByAttemptIdAndQuestionId(attempt.getId(), q.getId());
            if (respOpt.isPresent()) {
                QuestionResponse resp = respOpt.get();
                totalScore += Math.max(0.0, resp.getPointsEarned()); // don't double-count negatives
                if (Boolean.TRUE.equals(resp.getIsCorrect())) correct++;
                else incorrect++;
            } else {
                unanswered++;
            }
        }

        double percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 10000.0) / 100.0 : 0.0;
        boolean passed = percentage >= attempt.getQuiz().getPassingScore();
        long timeTaken = Duration.between(attempt.getStartTime(), now).toSeconds();

        attempt.setStatus(QuizAttemptStatus.EXPIRED);
        attempt.setSubmittedAt(now);
        attempt.setScore(totalScore);
        attempt.setMaxScore(maxScore);
        attempt.setPercentage(percentage);
        attempt.setPassed(passed);
        attempt.setCorrectCount(correct);
        attempt.setIncorrectCount(incorrect);
        attempt.setUnansweredCount(unanswered);
        attempt.setTimeTakenSeconds(timeTaken);

        quizAttemptRepository.save(attempt);
        sessionService.evictSession(attempt.getId());
        eventPublisher.publishAttemptFinalised(attempt, "ATTEMPT_EXPIRED");

        log.info("Attempt {} expired: score={}/{} ({}%) passed={}",
                attempt.getId(), totalScore, maxScore, percentage, passed);
    }
}
