package com.mindrift.analytics.service;

import com.mindrift.analytics.entity.AnalyticsSnapshot;
import com.mindrift.analytics.entity.QuizAnalytics;
import com.mindrift.analytics.entity.UserAnalytics;
import com.mindrift.analytics.repository.AnalyticsSnapshotRepository;
import com.mindrift.analytics.repository.QuizAnalyticsRepository;
import com.mindrift.analytics.repository.UserAnalyticsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Scheduled aggregation jobs that write AnalyticsSnapshot records.
 *
 * Jobs:
 *   1. Hourly user snapshots  — every hour on the hour
 *   2. Daily quiz snapshots   — every day at 00:05 UTC
 *   3. Weekly platform report — every Monday at 01:00 UTC
 *   4. Purge old hourly data  — every day at 02:00 UTC (keeps 7 days only)
 *
 * Snapshots enable historical trend charts without replaying all attempts.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AnalyticsAggregationJob {

    private static final DateTimeFormatter HOUR_FMT  = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH").withZone(ZoneOffset.UTC);
    private static final DateTimeFormatter DAY_FMT   = DateTimeFormatter.ofPattern("yyyy-MM-dd").withZone(ZoneOffset.UTC);
    private static final DateTimeFormatter WEEK_FMT  = DateTimeFormatter.ofPattern("yyyy-'W'ww").withZone(ZoneOffset.UTC);
    private static final DateTimeFormatter MONTH_FMT = DateTimeFormatter.ofPattern("yyyy-MM").withZone(ZoneOffset.UTC);

    private final UserAnalyticsRepository    userAnalyticsRepo;
    private final QuizAnalyticsRepository    quizAnalyticsRepo;
    private final AnalyticsSnapshotRepository snapshotRepo;

    @Scheduled(cron = "0 0 * * * *", zone = "UTC")  // every hour at :00
    @Transactional
    public void writeHourlyUserSnapshots() {
        log.info("Running hourly user analytics snapshot job via native DB bulk insert");
        Instant now = Instant.now();
        String label = HOUR_FMT.format(now);

        snapshotRepo.writeHourlyUserSnapshotsBulk(now, label);
        log.info("Hourly user snapshots bulk written in DB.");
    }

    // ─── 2. Daily quiz snapshots ──────────────────────────────────────────────

    @Scheduled(cron = "0 5 0 * * *", zone = "UTC")  // 00:05 UTC daily
    @Transactional
    public void writeDailyQuizSnapshots() {
        log.info("Running daily quiz analytics snapshot job");
        Instant now = Instant.now();
        String label = DAY_FMT.format(now);

        List<QuizAnalytics> allQuizzes = quizAnalyticsRepo.findAll();
        for (QuizAnalytics qa : allQuizzes) {
            AnalyticsSnapshot snap = new AnalyticsSnapshot();
            snap.setSubjectId(qa.getQuizId());
            snap.setSubjectType("QUIZ");
            snap.setSnapshotAt(now);
            snap.setPeriodLabel(label);
            snap.setGranularity("DAILY");
            snap.setTotalAttempts(qa.getTotalAttempts());
            snap.setTotalScore(qa.getAverageScore() * qa.getTotalAttempts());
            snap.setAverageScore(qa.getAverageScore());
            snap.setPassRate(qa.getPassRate());
            snap.setUniqueUsers(qa.getUniquePlayers());
            snapshotRepo.save(snap);
        }
        log.info("Daily quiz snapshots written: {} records", allQuizzes.size());
    }

    // ─── 3. Weekly platform snapshot ─────────────────────────────────────────

    @Scheduled(cron = "0 0 1 * * MON", zone = "UTC")  // Monday 01:00 UTC
    @Transactional
    public void writeWeeklyPlatformSnapshot() {
        log.info("Running weekly platform analytics snapshot via optimized database aggregates");
        Instant now = Instant.now();
        String label = WEEK_FMT.format(now);

        long totalUsers    = userAnalyticsRepo.count();
        long totalAttempts = userAnalyticsRepo.sumTotalAttempts();
        double avgScore    = userAnalyticsRepo.averageScorePlatform();
        double passRate    = userAnalyticsRepo.averagePassRatePlatform();

        AnalyticsSnapshot snap = new AnalyticsSnapshot();
        snap.setSubjectId(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001")); // Platform sentinel
        snap.setSubjectType("PLATFORM");
        snap.setSnapshotAt(now);
        snap.setPeriodLabel(label);
        snap.setGranularity("WEEKLY");
        snap.setTotalAttempts(totalAttempts);
        snap.setAverageScore(round(avgScore));
        snap.setPassRate(round(passRate));
        snap.setUniqueUsers(totalUsers);
        snapshotRepo.save(snap);

        log.info("Weekly platform snapshot written — users={} attempts={}", totalUsers, totalAttempts);
    }

    // ─── 4. Purge old hourly snapshots ────────────────────────────────────────

    @Scheduled(cron = "0 0 2 * * *", zone = "UTC")  // 02:00 UTC daily
    @Transactional
    public void purgeOldHourlySnapshots() {
        Instant cutoff = Instant.now().minusSeconds(7L * 24 * 3600); // 7 days ago
        snapshotRepo.purgeOldHourlySnapshots(cutoff);
        log.info("Purged hourly analytics snapshots older than {}", cutoff);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private String buildUserMetricsJson(UserAnalytics ua) {
        return String.format(
                "{\"totalAttempts\":%d,\"passedAttempts\":%d,\"accuracyRate\":%.2f,\"streakDays\":%d}",
                ua.getTotalAttempts(), ua.getPassedAttempts(),
                ua.getAccuracyRate(), ua.getCurrentStreakDays());
    }

    private static double round(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
