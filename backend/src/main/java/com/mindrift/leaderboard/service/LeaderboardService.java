package com.mindrift.leaderboard.service;

import com.mindrift.leaderboard.dto.*;
import com.mindrift.leaderboard.entity.LeaderboardEntry;
import com.mindrift.leaderboard.entity.LeaderboardSeason;
import com.mindrift.leaderboard.repository.LeaderboardEntryRepository;
import com.mindrift.leaderboard.repository.LeaderboardSeasonRepository;
import com.mindrift.quiz.entity.Category;
import com.mindrift.quiz.repository.CategoryRepository;
import com.mindrift.user.entity.User;
import com.mindrift.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

/**
 * LeaderboardService — the central read/write facade.
 *
 * Write path:  updateGlobalEntry() / updateCategoryEntry() → persist to DB + Redis ZSET
 * Read path:   getGlobal() / getCategory() / getCompetition() / getSeason()
 *              → reads from Redis (top-100 fast path) + DB for user's own rank
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private static final int TOP_N = 100;

    private final LeaderboardEntryRepository entryRepository;
    private final LeaderboardSeasonRepository seasonRepository;
    private final LeaderboardRedisService redis;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final AchievementService achievementService;

    // ─────────────────────────────────────────────────────────────────────────
    //  WRITE: Called after a quiz attempt is scored
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Updates (or creates) the global and optional category leaderboard entries
     * for the given user after a scored attempt. Also fires achievement evaluation.
     */
    @Transactional
    public void processQuizScored(QuizScoredEvent event) {
        User user = userRepository.findById(event.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + event.getUserId()));

        // ── Global entry ──────────────────────────────────────────────────────
        LeaderboardEntry global = entryRepository
                .findByUserIdAndCategoryIdIsNullAndSeasonIdIsNull(event.getUserId())
                .orElseGet(() -> createEntry(user, null, null));

        global.setTotalScore(global.getTotalScore() + event.getScore());
        global.setTotalAttempts(global.getTotalAttempts() + 1);
        global.setLastActive(Instant.now());
        if (event.isPerfectScore()) {
            global.setPerfectScores(global.getPerfectScores() + 1);
        }
        global.setAverageScore(global.getTotalScore() / global.getTotalAttempts());
        entryRepository.save(global);

        // Push delta to Redis ZSET
        redis.incrementGlobalScore(event.getUserId(), event.getScore());

        // ── Category entry (if quiz belongs to a category) ────────────────────
        if (event.getCategoryId() != null) {
            LeaderboardEntry catEntry = entryRepository
                    .findByUserIdAndCategoryIdAndSeasonIdIsNull(event.getUserId(), event.getCategoryId())
                    .orElseGet(() -> createEntry(user, event.getCategoryId(), null));

            catEntry.setTotalScore(catEntry.getTotalScore() + event.getScore());
            catEntry.setTotalAttempts(catEntry.getTotalAttempts() + 1);
            if (event.isPerfectScore()) catEntry.setPerfectScores(catEntry.getPerfectScores() + 1);
            catEntry.setAverageScore(catEntry.getTotalScore() / catEntry.getTotalAttempts());
            catEntry.setLastActive(Instant.now());
            entryRepository.save(catEntry);

            redis.incrementCategoryScore(event.getCategoryId(), event.getUserId(), event.getScore());
        }

        // ── Seasonal entry (if there is an active season) ─────────────────────
        seasonRepository.findByIsActiveTrue().ifPresent(season -> {
            LeaderboardEntry seasonEntry = entryRepository
                    .findByUserIdAndCategoryIdIsNullAndSeasonId(event.getUserId(), season.getId())
                    .orElseGet(() -> createEntry(user, null, season.getId()));

            seasonEntry.setTotalScore(seasonEntry.getTotalScore() + event.getScore());
            seasonEntry.setTotalAttempts(seasonEntry.getTotalAttempts() + 1);
            if (event.isPerfectScore()) seasonEntry.setPerfectScores(seasonEntry.getPerfectScores() + 1);
            seasonEntry.setAverageScore(seasonEntry.getTotalScore() / seasonEntry.getTotalAttempts());
            seasonEntry.setLastActive(Instant.now());
            entryRepository.save(seasonEntry);

            redis.incrementSeasonScore(season.getId(), event.getUserId(), event.getScore());
        });

        // ── Rank-based achievement evaluation ─────────────────────────────────
        OptionalInt rank = redis.getGlobalRank(event.getUserId());
        if (rank.isPresent()) {
            achievementService.evaluateAfterRankUpdate(user, rank.getAsInt());
        }

        // ── Attempt milestone achievements ────────────────────────────────────
        achievementService.evaluateAfterAttempt(
                user,
                global.getTotalAttempts(),
                event.isPerfectScore(),
                global.getPerfectScores()
        );

        log.debug("Leaderboard updated — user={} score=+{} global_total={}",
                event.getUserId(), event.getScore(), global.getTotalScore());
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  READ: Global Leaderboard
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public LeaderboardResponse getGlobal(UUID requestingUserId) {
        List<Map.Entry<String, Double>> top = redis.getGlobalTop(TOP_N);
        List<LeaderboardRowDto> rows = buildRows(top, requestingUserId);

        LeaderboardRowDto myRank = null;
        if (requestingUserId != null) {
            myRank = buildMyRankRow(requestingUserId, null, null, rows);
        }

        return LeaderboardResponse.builder()
                .scope("GLOBAL")
                .entries(rows)
                .totalParticipants(redis.globalParticipantCount())
                .myRank(myRank)
                .cachedAt(Instant.now())
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  READ: Category Leaderboard
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public LeaderboardResponse getCategory(UUID categoryId, UUID requestingUserId) {
        Category category = categoryRepository.findById(categoryId).orElse(null);
        List<Map.Entry<String, Double>> top = redis.getCategoryTop(categoryId, TOP_N);
        List<LeaderboardRowDto> rows = buildRows(top, requestingUserId);

        LeaderboardRowDto myRank = null;
        if (requestingUserId != null) {
            myRank = buildMyRankRow(requestingUserId, categoryId, null, rows);
        }

        return LeaderboardResponse.builder()
                .scope("CATEGORY")
                .categoryId(categoryId)
                .categoryName(category != null ? category.getName() : null)
                .entries(rows)
                .totalParticipants(redis.categoryParticipantCount(categoryId))
                .myRank(myRank)
                .cachedAt(Instant.now())
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  READ: Competition Leaderboard
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public LeaderboardResponse getCompetition(UUID competitionId, UUID requestingUserId) {
        List<Map.Entry<String, Double>> top = redis.getCompetitionTop(competitionId, TOP_N);
        List<LeaderboardRowDto> rows = buildRows(top, requestingUserId);

        LeaderboardRowDto myRank = null;
        if (requestingUserId != null) {
            OptionalInt rank = redis.getCompetitionRank(competitionId, requestingUserId);
            OptionalDouble score = OptionalDouble.empty();
            // Try to resolve own entry from top rows first
            myRank = rows.stream()
                    .filter(LeaderboardRowDto::isCurrentUser)
                    .findFirst()
                    .orElse(null);

            if (myRank == null && rank.isPresent()) {
                // User is ranked but outside top 100 — resolve from DB/redis
                myRank = buildOutOfTopRow(requestingUserId, rank.getAsInt(),
                        redis.getGlobalScore(requestingUserId).orElse(0.0));
            }
        }

        return LeaderboardResponse.builder()
                .scope("COMPETITION")
                .competitionId(competitionId)
                .entries(rows)
                .totalParticipants(redis.competitionParticipantCount(competitionId))
                .myRank(myRank)
                .cachedAt(Instant.now())
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  READ: Seasonal Leaderboard
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public LeaderboardResponse getSeason(UUID seasonId, UUID requestingUserId) {
        LeaderboardSeason season = seasonRepository.findById(seasonId).orElse(null);
        List<Map.Entry<String, Double>> top = redis.getSeasonTop(seasonId, TOP_N);
        List<LeaderboardRowDto> rows = buildRows(top, requestingUserId);

        LeaderboardRowDto myRank = null;
        if (requestingUserId != null) {
            myRank = buildMyRankRow(requestingUserId, null, seasonId, rows);
        }

        SeasonDto seasonDto = season == null ? null : SeasonDto.builder()
                .id(season.getId())
                .name(season.getName())
                .label(season.getLabel())
                .startDate(season.getStartDate())
                .endDate(season.getEndDate())
                .isActive(Boolean.TRUE.equals(season.getIsActive()))
                .build();

        return LeaderboardResponse.builder()
                .scope("SEASON")
                .season(seasonDto)
                .entries(rows)
                .totalParticipants(rows.size())
                .myRank(myRank)
                .cachedAt(Instant.now())
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  COMPETITION SCORE UPDATE (called by competition engine)
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public void updateCompetitionScore(UUID competitionId, UUID userId, double score) {
        redis.setCompetitionScore(competitionId, userId, score);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  READ: Active Season (convenience)
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public LeaderboardResponse getActiveSeason(UUID requestingUserId) {
        LeaderboardSeason active = seasonRepository.findByIsActiveTrue()
                .orElseThrow(() -> new com.mindrift.common.exception.ResourceNotFoundException("No active season found"));
        return getSeason(active.getId(), requestingUserId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  STARTUP HYDRATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Seeds Redis ZSETs from the DB on application startup.
     * Runs once during ApplicationReadyEvent.
     */
    @Transactional(readOnly = true)
    public void seedRedisFromDb() {
        // Global
        Map<String, Double> globalMap = new LinkedHashMap<>();
        entryRepository.findByCategoryIdIsNullAndSeasonIdIsNullOrderByTotalScoreDesc()
                .forEach(e -> globalMap.put(e.getUser().getId().toString(), e.getTotalScore()));
        redis.bulkSeed(redis.globalKey(), globalMap);
        log.info("Seeded global leaderboard — {} entries", globalMap.size());
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private LeaderboardEntry createEntry(User user, UUID categoryId, UUID seasonId) {
        LeaderboardEntry e = new LeaderboardEntry();
        e.setUser(user);
        e.setCategoryId(categoryId);
        e.setSeasonId(seasonId);
        return e;
    }

    /**
     * Converts a raw Redis ZSET result into DTOs, enriching with user profile data.
     * User profiles are batch-loaded to avoid N+1 queries.
     */
    private List<LeaderboardRowDto> buildRows(List<Map.Entry<String, Double>> raw, UUID currentUserId) {
        if (raw.isEmpty()) return Collections.emptyList();

        // Batch-load all users
        List<UUID> ids = raw.stream()
                .map(e -> UUID.fromString(e.getKey()))
                .toList();
        Map<UUID, User> userMap = new HashMap<>();
        userRepository.findAllById(ids).forEach(u -> userMap.put(u.getId(), u));

        List<LeaderboardRowDto> rows = new ArrayList<>(raw.size());
        for (int i = 0; i < raw.size(); i++) {
            Map.Entry<String, Double> entry = raw.get(i);
            UUID uid = UUID.fromString(entry.getKey());
            User u = userMap.get(uid);
            if (u == null) continue;

            rows.add(LeaderboardRowDto.builder()
                    .rank(i + 1)
                    .userId(uid)
                    .username(u.getUsername())
                    .displayName(buildDisplayName(u))
                    .avatarUrl(u.getAvatarUrl())
                    .totalScore(entry.getValue())
                    .isCurrentUser(uid.equals(currentUserId))
                    .build());
        }
        return rows;
    }

    /**
     * Find the requesting user's row from the already-loaded top list,
     * or resolve from DB + Redis if they're outside the top 100.
     */
    private LeaderboardRowDto buildMyRankRow(UUID userId,
                                              UUID categoryId,
                                              UUID seasonId,
                                              List<LeaderboardRowDto> top) {
        // Fast path: already in top-N list
        return top.stream()
                .filter(r -> r.getUserId().equals(userId))
                .findFirst()
                .orElseGet(() -> {
                    // Slow path: outside top-N
                    OptionalInt rank = (categoryId != null)
                            ? redis.getCategoryRank(categoryId, userId)
                            : (seasonId != null)
                                ? redis.getSeasonRank(seasonId, userId)
                                : redis.getGlobalRank(userId);
                    if (rank.isEmpty()) return null;

                    OptionalDouble score = redis.getGlobalScore(userId);
                    return buildOutOfTopRow(userId, rank.getAsInt(), score.orElse(0.0));
                });
    }

    private LeaderboardRowDto buildOutOfTopRow(UUID userId, int rank, double score) {
        return userRepository.findById(userId)
                .map(u -> LeaderboardRowDto.builder()
                        .rank(rank)
                        .userId(userId)
                        .username(u.getUsername())
                        .displayName(buildDisplayName(u))
                        .avatarUrl(u.getAvatarUrl())
                        .totalScore(score)
                        .isCurrentUser(true)
                        .build())
                .orElse(null);
    }

    private String buildDisplayName(User u) {
        if (u.getFirstName() != null && u.getLastName() != null) {
            return u.getFirstName() + " " + u.getLastName();
        }
        if (u.getFirstName() != null) return u.getFirstName();
        return u.getUsername() != null ? u.getUsername() : u.getEmail();
    }
}
