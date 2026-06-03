package com.mindrift.analytics.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindrift.analytics.dto.*;
import com.mindrift.analytics.entity.*;
import com.mindrift.analytics.repository.*;
import com.mindrift.quiz.entity.Quiz;
import com.mindrift.quiz.entity.Question;
import com.mindrift.quiz.repository.QuizRepository;
import com.mindrift.quiz.repository.QuestionResponseRepository;
import com.mindrift.user.entity.User;
import com.mindrift.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Core analytics service.
 *
 * Write path: processAttemptFinalised() — called by Kafka consumer on ATTEMPT_FINALISED
 * Read path:  getUserAnalytics(), getQuizAnalytics(), getCompetitionAnalytics()
 *
 * Cache strategy:
 *   - user analytics: cached 5 min (cache: "analytics-user")
 *   - quiz analytics: cached 10 min (cache: "analytics-quiz")
 *   - competition analytics: cached 30 min (cache: "analytics-competition")
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final UserAnalyticsRepository    userAnalyticsRepo;
    private final QuizAnalyticsRepository    quizAnalyticsRepo;
    private final CompetitionAnalyticsRepository compAnalyticsRepo;
    private final SkillAnalyticsRepository   skillAnalyticsRepo;
    private final AnalyticsSnapshotRepository snapshotRepo;
    private final UserRepository             userRepository;
    private final QuizRepository             quizRepository;
    private final QuestionResponseRepository questionResponseRepo;
    private final ObjectMapper               objectMapper;

    // ─────────────────────────────────────────────────────────────────────────
    //  WRITE: Process scored attempt
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Main analytics ingestion point — called by the Kafka consumer after every
     * ATTEMPT_FINALISED event. Updates UserAnalytics, QuizAnalytics, and SkillAnalytics
     * in a single transaction. Cache entries are evicted after write.
     */
    @Transactional
    @CacheEvict(cacheNames = {"analytics-user", "analytics-quiz"}, allEntries = false,
                key          = "#event.userId")
    public void processAttemptFinalised(AttemptFinalisedAnalyticsEvent event) {
        log.debug("Processing analytics for attempt={} user={}", event.getAttemptId(), event.getUserId());

        User user = userRepository.findById(event.getUserId()).orElse(null);
        if (user == null) {
            log.warn("Analytics: user {} not found, skipping", event.getUserId());
            return;
        }

        // Only count fully submitted or expired (not cancelled/started)
        if (!"ATTEMPT_SUBMITTED".equals(event.getEventType())
                && !"ATTEMPT_EXPIRED".equals(event.getEventType())) {
            return;
        }

        updateUserAnalytics(user, event);
        updateQuizAnalytics(event);
        if (event.getCategoryId() != null) {
            updateSkillAnalytics(user, event);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  READ: User Analytics
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = "analytics-user", key = "#userId")
    public UserAnalyticsResponse getUserAnalytics(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new com.mindrift.common.exception.ResourceNotFoundException("User not found: " + userId));

        UserAnalytics ua = userAnalyticsRepo.findByUserId(userId)
                .orElse(emptyUserAnalytics(user));

        List<SkillAnalytics> skills = skillAnalyticsRepo.findByUserIdOrderByMasteryScoreDesc(userId);

        // Historical score snapshots (last 30 daily points)
        List<AnalyticsSnapshot> snapshots = snapshotRepo
                .findBySubjectIdAndSubjectTypeAndGranularityOrderBySnapshotAtDesc(
                        userId, "USER", "DAILY");
        List<SnapshotPointDto> history = snapshots.stream()
                .limit(30)
                .sorted(Comparator.comparing(AnalyticsSnapshot::getSnapshotAt))
                .map(this::toSnapshotPoint)
                .toList();

        // Difficulty breakdowns from JSON
        Map<String, Long>   diffAttempts  = parseJsonMap(ua.getDifficultyBreakdown(),  new TypeReference<>(){});
        Map<String, Double> diffAvgScores = parseJsonMap(ua.getDifficultyAvgScore(),    new TypeReference<>(){});

        double passRate = ua.getSubmittedAttempts() > 0
                ? ((double) ua.getPassedAttempts() / ua.getSubmittedAttempts()) * 100.0 : 0.0;
        double winRate  = ua.getCompetitionParticipations() > 0
                ? ((double) ua.getCompetitionWins() / ua.getCompetitionParticipations()) * 100.0 : 0.0;

        return UserAnalyticsResponse.builder()
                .userId(userId)
                .username(user.getUsername())
                .displayName(buildDisplayName(user))
                .avatarUrl(user.getAvatarUrl())
                .totalAttempts(ua.getTotalAttempts())
                .submittedAttempts(ua.getSubmittedAttempts())
                .passedAttempts(ua.getPassedAttempts())
                .perfectScoreCount(ua.getPerfectScoreCount())
                .passRate(round(passRate))
                .totalScore(ua.getTotalScore())
                .averageScore(ua.getAverageScore())
                .bestScore(ua.getBestScore())
                .averagePercentage(ua.getAveragePercentage())
                .totalQuestionsAnswered(ua.getTotalQuestionsAnswered())
                .totalCorrect(ua.getTotalCorrect())
                .totalIncorrect(ua.getTotalIncorrect())
                .totalUnanswered(ua.getTotalUnanswered())
                .accuracyRate(ua.getAccuracyRate())
                .totalTimeSpentSeconds(ua.getTotalTimeSpentSeconds())
                .averageTimePerAttemptSeconds(ua.getAverageTimePerAttemptSeconds())
                .currentStreakDays(ua.getCurrentStreakDays())
                .longestStreakDays(ua.getLongestStreakDays())
                .lastActiveAt(ua.getLastActiveAt())
                .skillBreakdown(skills.stream().map(this::toSkillSummary).toList())
                .attemptsPerDifficulty(diffAttempts)
                .avgScorePerDifficulty(diffAvgScores)
                .favouriteCategoryId(ua.getFavouriteCategoryId())
                .favouriteCategoryName(ua.getFavouriteCategoryName())
                .competitionParticipations(ua.getCompetitionParticipations())
                .competitionWins(ua.getCompetitionWins())
                .competitionWinRate(round(winRate))
                .scoreHistory(history)
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  READ: Quiz Analytics
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = "analytics-quiz", key = "#quizId")
    public QuizAnalyticsResponse getQuizAnalytics(UUID quizId) {
        QuizAnalytics qa = quizAnalyticsRepo.findByQuizId(quizId)
                .orElseThrow(() -> new com.mindrift.common.exception.ResourceNotFoundException(
                        "No analytics found for quiz: " + quizId));

        // Question-level insights from JSON map
        List<QuestionInsightDto> insights = buildQuestionInsights(qa);

        // Historical trend snapshots (last 30 daily)
        List<AnalyticsSnapshot> snapshots = snapshotRepo
                .findBySubjectIdAndSubjectTypeAndGranularityOrderBySnapshotAtDesc(
                        quizId, "QUIZ", "DAILY");
        List<SnapshotPointDto> trend = snapshots.stream()
                .limit(30)
                .sorted(Comparator.comparing(AnalyticsSnapshot::getSnapshotAt))
                .map(this::toSnapshotPoint)
                .toList();

        double completionRate = qa.getTotalAttempts() > 0
                ? ((double) qa.getSubmittedAttempts() / qa.getTotalAttempts()) * 100.0 : 0.0;

        return QuizAnalyticsResponse.builder()
                .quizId(qa.getQuizId())
                .quizTitle(qa.getQuizTitle())
                .categoryId(qa.getCategoryId())
                .categoryName(qa.getCategoryName())
                .totalAttempts(qa.getTotalAttempts())
                .uniquePlayers(qa.getUniquePlayers())
                .submittedAttempts(qa.getSubmittedAttempts())
                .expiredAttempts(qa.getExpiredAttempts())
                .completionRate(round(completionRate))
                .averageScore(qa.getAverageScore())
                .averagePercentage(qa.getAveragePercentage())
                .highestScore(qa.getHighestScore())
                .lowestScore(qa.getLowestScore())
                .passCount(qa.getPassCount())
                .passRate(qa.getPassRate())
                .perfectScoreCount(qa.getPerfectScoreCount())
                .repeatAttemptRate(qa.getRepeatAttemptRate())
                .averageTimeSeconds(qa.getAverageTimeSeconds())
                .fastestCompletionSeconds(qa.getFastestCompletionSeconds())
                .questionInsights(insights)
                .hardestQuestionId(qa.getHardestQuestionId())
                .easiestQuestionId(qa.getEasiestQuestionId())
                .attemptsTrend(trend)
                .lastAttemptedAt(qa.getLastAttemptedAt())
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  READ: Competition Analytics
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = "analytics-competition", key = "#competitionId")
    public CompetitionAnalyticsResponse getCompetitionAnalytics(UUID competitionId) {
        CompetitionAnalytics ca = compAnalyticsRepo.findByCompetitionId(competitionId)
                .orElseThrow(() -> new com.mindrift.common.exception.ResourceNotFoundException(
                        "No analytics found for competition: " + competitionId));

        List<TopPlayerDto> top3 = parseTop3Json(ca.getTop3Json());

        String winnerUsername = null;
        Double winnerScore    = null;
        if (!top3.isEmpty()) {
            winnerUsername = top3.get(0).getUsername();
            winnerScore    = top3.get(0).getScore();
        }

        return CompetitionAnalyticsResponse.builder()
                .competitionId(ca.getCompetitionId())
                .competitionTitle(ca.getCompetitionTitle())
                .quizId(ca.getQuizId())
                .organizerId(ca.getOrganizerId())
                .registeredCount(ca.getRegisteredCount())
                .activeCount(ca.getActiveCount())
                .completedCount(ca.getCompletedCount())
                .disqualifiedCount(ca.getDisqualifiedCount())
                .dropoutRate(ca.getDropoutRate())
                .averageScore(ca.getAverageScore())
                .highestScore(ca.getHighestScore())
                .lowestScore(ca.getLowestScore())
                .medianScore(ca.getMedianScore())
                .passRate(ca.getPassRate())
                .top3(top3)
                .startedAt(ca.getStartedAt())
                .endedAt(ca.getEndedAt())
                .durationMinutes(ca.getDurationMinutes())
                .averageCompletionSeconds(ca.getAverageCompletionSeconds())
                .totalRounds(ca.getTotalRounds())
                .winnerUserId(ca.getWinnerUserId())
                .winnerUsername(winnerUsername)
                .winnerScore(winnerScore)
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  WRITE: Competition Analytics (called by competition engine on close)
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    @CacheEvict(cacheNames = "analytics-competition", key = "#competitionId")
    public void createOrUpdateCompetitionAnalytics(UUID competitionId,
                                                    String title,
                                                    UUID organizerId,
                                                    UUID quizId,
                                                    long registered,
                                                    long completed,
                                                    long disqualified,
                                                    double avgScore,
                                                    double highScore,
                                                    double lowScore,
                                                    double medianScore,
                                                    double passRate,
                                                    int totalRounds,
                                                    Instant startedAt,
                                                    Instant endedAt,
                                                    List<TopPlayerDto> top3,
                                                    UUID winnerUserId) {
        CompetitionAnalytics ca = compAnalyticsRepo.findByCompetitionId(competitionId)
                .orElseGet(CompetitionAnalytics::new);

        ca.setCompetitionId(competitionId);
        ca.setCompetitionTitle(title);
        ca.setOrganizerId(organizerId);
        ca.setQuizId(quizId);
        ca.setRegisteredCount(registered);
        ca.setCompletedCount(completed);
        ca.setDisqualifiedCount(disqualified);
        ca.setDropoutRate(registered > 0 ? round((1.0 - (double) completed / registered) * 100) : 0);
        ca.setAverageScore(avgScore);
        ca.setHighestScore(highScore);
        ca.setLowestScore(lowScore);
        ca.setMedianScore(medianScore);
        ca.setPassRate(passRate);
        ca.setTotalRounds(totalRounds);
        ca.setStartedAt(startedAt);
        ca.setEndedAt(endedAt);
        ca.setWinnerUserId(winnerUserId);
        if (startedAt != null && endedAt != null) {
            ca.setDurationMinutes((int) ChronoUnit.MINUTES.between(startedAt, endedAt));
        }
        ca.setTop3Json(toJson(top3));
        compAnalyticsRepo.save(ca);
        log.info("Competition analytics saved for competition={}", competitionId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  PRIVATE: Update UserAnalytics
    // ─────────────────────────────────────────────────────────────────────────

    private void updateUserAnalytics(User user, AttemptFinalisedAnalyticsEvent event) {
        UserAnalytics ua = userAnalyticsRepo.findByUserId(user.getId())
                .orElseGet(() -> {
                    UserAnalytics fresh = new UserAnalytics();
                    fresh.setUser(user);
                    return fresh;
                });

        boolean isSubmitted = "ATTEMPT_SUBMITTED".equals(event.getEventType());
        boolean isPerfect   = event.getPercentage() >= 100.0;

        ua.setTotalAttempts(ua.getTotalAttempts() + 1);
        if (isSubmitted) {
            ua.setSubmittedAttempts(ua.getSubmittedAttempts() + 1);
            if (event.isPassed()) ua.setPassedAttempts(ua.getPassedAttempts() + 1);
            if (isPerfect)        ua.setPerfectScoreCount(ua.getPerfectScoreCount() + 1);
        }

        ua.setTotalScore(ua.getTotalScore() + event.getScore());
        ua.setAverageScore(ua.getSubmittedAttempts() > 0
                ? ua.getTotalScore() / ua.getSubmittedAttempts() : 0.0);
        ua.setBestScore(Math.max(ua.getBestScore(), event.getScore()));
        ua.setAveragePercentage(ua.getSubmittedAttempts() > 0
                ? (ua.getAveragePercentage() * (ua.getSubmittedAttempts() - 1) + event.getPercentage())
                  / ua.getSubmittedAttempts()
                : event.getPercentage());

        ua.setTotalCorrect(ua.getTotalCorrect()       + event.getCorrectCount());
        ua.setTotalIncorrect(ua.getTotalIncorrect()   + event.getIncorrectCount());
        ua.setTotalUnanswered(ua.getTotalUnanswered() + event.getUnansweredCount());
        long totalAnswered = ua.getTotalCorrect() + ua.getTotalIncorrect();
        ua.setTotalQuestionsAnswered(totalAnswered + ua.getTotalUnanswered());
        ua.setAccuracyRate(totalAnswered > 0
                ? round((double) ua.getTotalCorrect() / totalAnswered * 100) : 0.0);

        ua.setTotalTimeSpentSeconds(ua.getTotalTimeSpentSeconds() + event.getTimeTakenSeconds());
        ua.setAverageTimePerAttemptSeconds(ua.getSubmittedAttempts() > 0
                ? ua.getTotalTimeSpentSeconds() / ua.getSubmittedAttempts() : 0L);

        // Streak logic
        Instant now       = Instant.now();
        Instant yesterday = now.minus(25, ChronoUnit.HOURS); // 25h grace
        if (ua.getLastActiveAt() == null || ua.getLastActiveAt().isBefore(yesterday)) {
            ua.setCurrentStreakDays(1);
        } else if (ua.getLastActiveAt().isBefore(now.minus(1, ChronoUnit.HOURS))) {
            ua.setCurrentStreakDays(ua.getCurrentStreakDays() + 1);
        }
        ua.setLongestStreakDays(Math.max(ua.getLongestStreakDays(), ua.getCurrentStreakDays()));
        ua.setLastActiveAt(now);

        // Difficulty breakdown JSON update
        if (event.getDifficulty() != null) {
            String updatedBreakdown = updateDifficultyCount(
                    ua.getDifficultyBreakdown(), event.getDifficulty());
            ua.setDifficultyBreakdown(updatedBreakdown);

            long count = 1L;
            try {
                Map<String, Long> countMap = objectMapper.readValue(updatedBreakdown, new TypeReference<Map<String, Long>>() {});
                count = countMap.getOrDefault(event.getDifficulty(), 1L);
            } catch (Exception ignored) {}

            ua.setDifficultyAvgScore(updateDifficultyAvgScore(
                    ua.getDifficultyAvgScore(), event.getDifficulty(), event.getPercentage(), count));
        }

        userAnalyticsRepo.save(ua);
        log.debug("UserAnalytics updated — user={} totalAttempts={}", user.getId(), ua.getTotalAttempts());
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  PRIVATE: Update QuizAnalytics
    // ─────────────────────────────────────────────────────────────────────────

    private void updateQuizAnalytics(AttemptFinalisedAnalyticsEvent event) {
        QuizAnalytics qa = quizAnalyticsRepo.findByQuizId(event.getQuizId())
                .orElseGet(() -> {
                    QuizAnalytics fresh = new QuizAnalytics();
                    fresh.setQuizId(event.getQuizId());
                    // Enrich with quiz metadata from DB
                    quizRepository.findById(event.getQuizId()).ifPresent(q -> {
                        fresh.setQuizTitle(q.getTitle());
                        if (q.getCategory() != null) {
                            fresh.setCategoryId(q.getCategory().getId());
                            fresh.setCategoryName(q.getCategory().getName());
                        }
                    });
                    return fresh;
                });

        boolean isSubmitted = "ATTEMPT_SUBMITTED".equals(event.getEventType());
        boolean isExpired   = "ATTEMPT_EXPIRED".equals(event.getEventType());
        boolean isPerfect   = event.getPercentage() >= 100.0;

        long prevSubmitted = qa.getSubmittedAttempts();

        qa.setTotalAttempts(qa.getTotalAttempts() + 1);
        if (isSubmitted) qa.setSubmittedAttempts(prevSubmitted + 1);
        if (isExpired)   qa.setExpiredAttempts(qa.getExpiredAttempts() + 1);
        if (event.isPassed()) qa.setPassCount(qa.getPassCount() + 1);
        if (isPerfect)   qa.setPerfectScoreCount(qa.getPerfectScoreCount() + 1);

        // Running average score
        long submitted = qa.getSubmittedAttempts();
        if (submitted > 0) {
            qa.setAverageScore(round(
                    (qa.getAverageScore() * prevSubmitted + event.getScore()) / submitted));
            qa.setAveragePercentage(round(
                    (qa.getAveragePercentage() * prevSubmitted + event.getPercentage()) / submitted));
        }
        qa.setHighestScore(Math.max(qa.getHighestScore(), event.getScore()));
        if (qa.getTotalAttempts() == 1 || event.getScore() < qa.getLowestScore()) {
            qa.setLowestScore(event.getScore());
        }
        qa.setPassRate(submitted > 0 ? round((double) qa.getPassCount() / submitted * 100) : 0.0);

        // Timing
        if (event.getTimeTakenSeconds() > 0) {
            qa.setAverageTimeSeconds(submitted > 0
                    ? (qa.getAverageTimeSeconds() * (submitted - 1) + event.getTimeTakenSeconds()) / submitted
                    : event.getTimeTakenSeconds());
            if (qa.getFastestCompletionSeconds() == null
                    || event.getTimeTakenSeconds() < qa.getFastestCompletionSeconds()) {
                qa.setFastestCompletionSeconds(event.getTimeTakenSeconds());
            }
        }

        qa.setLastAttemptedAt(event.getOccurredAt());
        quizAnalyticsRepo.save(qa);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  PRIVATE: Update SkillAnalytics
    // ─────────────────────────────────────────────────────────────────────────

    private void updateSkillAnalytics(User user, AttemptFinalisedAnalyticsEvent event) {
        SkillAnalytics skill = skillAnalyticsRepo
                .findByUserIdAndCategoryId(user.getId(), event.getCategoryId())
                .orElseGet(() -> {
                    SkillAnalytics fresh = new SkillAnalytics();
                    fresh.setUser(user);
                    fresh.setCategoryId(event.getCategoryId());
                    // Resolve category name from quiz
                    quizRepository.findById(event.getQuizId()).ifPresent(q -> {
                        if (q.getCategory() != null) {
                            fresh.setCategoryName(q.getCategory().getName());
                        }
                    });
                    return fresh;
                });

        long prevAttempts = skill.getAttemptsInCategory();
        skill.setAttemptsInCategory(prevAttempts + 1);
        skill.setCorrectAnswersInCategory(
                skill.getCorrectAnswersInCategory() + event.getCorrectCount());
        skill.setTotalAnswersInCategory(
                skill.getTotalAnswersInCategory() + event.getCorrectCount() + event.getIncorrectCount());

        // Running accuracy
        long totalAns = skill.getTotalAnswersInCategory();
        if (totalAns > 0) {
            skill.setAccuracyInCategory(round(
                    (double) skill.getCorrectAnswersInCategory() / totalAns * 100));
        }

        // Running average score
        long attempts = skill.getAttemptsInCategory();
        skill.setAverageScoreInCategory(round(
                (skill.getAverageScoreInCategory() * prevAttempts + event.getPercentage()) / attempts));

        // Mastery score: weighted blend of accuracy (40%) + avg score (60%)
        double mastery = (skill.getAccuracyInCategory() * 0.40)
                       + (skill.getAverageScoreInCategory() * 0.60);
        skill.setMasteryScore(round(mastery));

        // Skill level from mastery
        skill.setSkillLevel(masteryToLevel(mastery));

        // Trend: compare last 5 vs previous 5 scores from score_history JSON
        skill.setScoreHistory(updateScoreHistory(skill.getScoreHistory(), event.getPercentage()));
        updateTrend(skill);

        skillAnalyticsRepo.save(skill);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  PRIVATE: Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private String masteryToLevel(double mastery) {
        if (mastery >= 85) return "EXPERT";
        if (mastery >= 70) return "ADVANCED";
        if (mastery >= 50) return "INTERMEDIATE";
        return "BEGINNER";
    }

    private void updateTrend(SkillAnalytics skill) {
        try {
            List<Double> history = objectMapper.readValue(
                    skill.getScoreHistory(), new TypeReference<>() {});
            if (history.size() < 4) {
                skill.setTrend("STABLE");
                skill.setTrendDelta(0.0);
                return;
            }
            int half = history.size() / 2;
            double recent = history.subList(half, history.size()).stream()
                    .mapToDouble(Double::doubleValue).average().orElse(0);
            double older = history.subList(0, half).stream()
                    .mapToDouble(Double::doubleValue).average().orElse(0);
            double delta = round(recent - older);
            skill.setTrendDelta(delta);
            if (delta > 3.0)       skill.setTrend("IMPROVING");
            else if (delta < -3.0) skill.setTrend("DECLINING");
            else                   skill.setTrend("STABLE");
        } catch (Exception e) {
            skill.setTrend("STABLE");
        }
    }

    private String updateScoreHistory(String existing, double newScore) {
        try {
            List<Double> history = new ArrayList<>(
                    objectMapper.readValue(existing, new TypeReference<>() {}));
            history.add(newScore);
            if (history.size() > 10) history = history.subList(history.size() - 10, history.size());
            return objectMapper.writeValueAsString(history);
        } catch (Exception e) {
            return "[" + newScore + "]";
        }
    }

    private String updateDifficultyCount(String existing, String difficulty) {
        try {
            Map<String, Long> map = new HashMap<>(
                    objectMapper.readValue(existing, new TypeReference<>() {}));
            map.merge(difficulty, 1L, Long::sum);
            return objectMapper.writeValueAsString(map);
        } catch (Exception e) { return "{}"; }
    }

    private String updateDifficultyAvgScore(String existing, String difficulty, double newScore, long count) {
        try {
            Map<String, Double> map = new HashMap<>(
                    objectMapper.readValue(existing, new TypeReference<Map<String, Double>>() {}));
            map.merge(difficulty, newScore, (old, n) -> {
                if (count <= 1) return n;
                // True cumulative average formula: (old * (count - 1) + new) / count
                return round((old * (count - 1) + n) / (double) count);
            });
            return objectMapper.writeValueAsString(map);
        } catch (Exception e) { return "{}"; }
    }

    private List<QuestionInsightDto> buildQuestionInsights(QuizAnalytics qa) {
        try {
            if (qa.getQuestionAccuracyMap() == null || qa.getQuestionAccuracyMap().isBlank()
                    || "{}".equals(qa.getQuestionAccuracyMap())) {
                return Collections.emptyList();
            }
            Map<String, Map<String, Object>> raw = objectMapper.readValue(
                    qa.getQuestionAccuracyMap(), new TypeReference<>() {});
            return raw.entrySet().stream().map(e -> {
                Map<String, Object> v = e.getValue();
                long correct  = ((Number) v.getOrDefault("correct", 0)).longValue();
                long total    = ((Number) v.getOrDefault("total", 0)).longValue();
                double acc    = total > 0 ? round((double) correct / total * 100) : 0.0;
                return QuestionInsightDto.builder()
                        .questionId(UUID.fromString(e.getKey()))
                        .totalAnswered(total)
                        .correctCount(correct)
                        .accuracyRate(acc)
                        .inferredDifficulty(acc >= 70 ? "EASY" : acc >= 40 ? "MEDIUM" : "HARD")
                        .build();
            }).toList();
        } catch (Exception ex) {
            return Collections.emptyList();
        }
    }

    private List<TopPlayerDto> parseTop3Json(String json) {
        try {
            if (json == null || "[]".equals(json)) return Collections.emptyList();
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) { return Collections.emptyList(); }
    }

    private <K, V> Map<K, V> parseJsonMap(String json, TypeReference<Map<K, V>> ref) {
        try {
            if (json == null || "{}".equals(json)) return Collections.emptyMap();
            return objectMapper.readValue(json, ref);
        } catch (Exception e) { return Collections.emptyMap(); }
    }

    private String toJson(Object obj) {
        try { return objectMapper.writeValueAsString(obj); }
        catch (Exception e) { return "{}"; }
    }

    private SnapshotPointDto toSnapshotPoint(AnalyticsSnapshot s) {
        return SnapshotPointDto.builder()
                .timestamp(s.getSnapshotAt())
                .periodLabel(s.getPeriodLabel())
                .averageScore(s.getAverageScore())
                .totalAttempts(s.getTotalAttempts())
                .passRate(s.getPassRate())
                .build();
    }

    private SkillSummaryDto toSkillSummary(SkillAnalytics s) {
        return SkillSummaryDto.builder()
                .categoryId(s.getCategoryId())
                .categoryName(s.getCategoryName())
                .masteryScore(s.getMasteryScore())
                .skillLevel(s.getSkillLevel())
                .accuracyInCategory(s.getAccuracyInCategory())
                .attemptsInCategory(s.getAttemptsInCategory())
                .trend(s.getTrend())
                .build();
    }

    private UserAnalytics emptyUserAnalytics(User user) {
        UserAnalytics ua = new UserAnalytics();
        ua.setUser(user);
        return ua;
    }

    private String buildDisplayName(User u) {
        if (u.getFirstName() != null && u.getLastName() != null)
            return u.getFirstName() + " " + u.getLastName();
        if (u.getFirstName() != null) return u.getFirstName();
        return u.getUsername() != null ? u.getUsername() : u.getEmail();
    }

    private static double round(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
