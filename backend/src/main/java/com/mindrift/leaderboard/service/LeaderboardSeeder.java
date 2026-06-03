package com.mindrift.leaderboard.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Seeds Redis ZSET leaderboards from the database on startup.
 *
 * This ensures that after a pod restart all in-memory ranking data
 * is restored from the authoritative PostgreSQL records before traffic
 * is accepted. Runs once after the application context is fully started.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LeaderboardSeeder {

    private final LeaderboardService leaderboardService;

    @EventListener(ApplicationReadyEvent.class)
    public void seed() {
        log.info("Seeding Redis leaderboard ZSETs from database...");
        try {
            leaderboardService.seedRedisFromDb();
            log.info("Leaderboard Redis seed complete.");
        } catch (Exception ex) {
            log.error("Leaderboard Redis seed failed — rankings will be rebuilt incrementally: {}", ex.getMessage(), ex);
            // Non-fatal: application continues; rankings recover as attempts are scored
        }
    }
}
