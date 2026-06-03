package com.mindrift.leaderboard.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;

/**
 * Redis ZSET–based leaderboard cache.
 *
 * Key schema:
 *   lb:global          – global all-time ZSET  (member = userId, score = totalScore)
 *   lb:cat:{catId}     – per-category ZSET
 *   lb:comp:{compId}   – per-competition ZSET
 *   lb:season:{sid}    – per-season ZSET
 *   lb:top100:global   – serialised JSON cache of top-100 global (10-min TTL)
 *   lb:top100:cat:{id} – serialised JSON cache of top-100 per category
 *   lb:rank:{userId}   – hash of userId → rank map (optional fast lookup)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LeaderboardRedisService {

    private static final String KEY_GLOBAL        = "lb:global";
    private static final String KEY_CAT_PREFIX    = "lb:cat:";
    private static final String KEY_COMP_PREFIX   = "lb:comp:";
    private static final String KEY_SEASON_PREFIX = "lb:season:";
    private static final int    TOP_N             = 100;
    private static final Duration CACHE_TTL       = Duration.ofMinutes(10);

    private final RedisTemplate<String, String> redisTemplate;

    // ─────────────────────────────────────────────────────────────────────────
    //  SCORE UPDATES
    // ─────────────────────────────────────────────────────────────────────────

    /** Atomically add `delta` to the user's score in the global ZSET. */
    public void incrementGlobalScore(UUID userId, double delta) {
        redisTemplate.opsForZSet().incrementScore(KEY_GLOBAL, userId.toString(), delta);
        invalidateTop100Cache(KEY_GLOBAL);
    }

    /** Add/update user score in the category ZSET. */
    public void incrementCategoryScore(UUID categoryId, UUID userId, double delta) {
        String key = KEY_CAT_PREFIX + categoryId;
        redisTemplate.opsForZSet().incrementScore(key, userId.toString(), delta);
        invalidateTop100Cache(key);
    }

    /** Set (overwrite) a competition participant's score. */
    public void setCompetitionScore(UUID competitionId, UUID userId, double score) {
        String key = KEY_COMP_PREFIX + competitionId;
        redisTemplate.opsForZSet().add(key, userId.toString(), score);
        invalidateTop100Cache(key);
    }

    /** Add score to a seasonal ZSET. */
    public void incrementSeasonScore(UUID seasonId, UUID userId, double delta) {
        String key = KEY_SEASON_PREFIX + seasonId;
        redisTemplate.opsForZSet().incrementScore(key, userId.toString(), delta);
        invalidateTop100Cache(key);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  TOP-N RETRIEVAL (descending score)
    // ─────────────────────────────────────────────────────────────────────────

    /** Returns top-N entries from the global leaderboard: list of [userId, score] pairs. */
    public List<Map.Entry<String, Double>> getGlobalTop(int n) {
        return getTopN(KEY_GLOBAL, n);
    }

    public List<Map.Entry<String, Double>> getCategoryTop(UUID categoryId, int n) {
        return getTopN(KEY_CAT_PREFIX + categoryId, n);
    }

    public List<Map.Entry<String, Double>> getCompetitionTop(UUID competitionId, int n) {
        return getTopN(KEY_COMP_PREFIX + competitionId, n);
    }

    public List<Map.Entry<String, Double>> getSeasonTop(UUID seasonId, int n) {
        return getTopN(KEY_SEASON_PREFIX + seasonId, n);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  RANK LOOKUP  (1-based, descending)
    // ─────────────────────────────────────────────────────────────────────────

    public OptionalInt getGlobalRank(UUID userId) {
        return getRank(KEY_GLOBAL, userId);
    }

    public OptionalInt getCategoryRank(UUID categoryId, UUID userId) {
        return getRank(KEY_CAT_PREFIX + categoryId, userId);
    }

    public OptionalInt getCompetitionRank(UUID competitionId, UUID userId) {
        return getRank(KEY_COMP_PREFIX + competitionId, userId);
    }

    public OptionalInt getSeasonRank(UUID seasonId, UUID userId) {
        return getRank(KEY_SEASON_PREFIX + seasonId, userId);
    }

    /** Returns user's score in the global ZSET, or empty if not present. */
    public OptionalDouble getGlobalScore(UUID userId) {
        Double score = redisTemplate.opsForZSet().score(KEY_GLOBAL, userId.toString());
        return score == null ? OptionalDouble.empty() : OptionalDouble.of(score);
    }

    /** Total members in global ZSET */
    public long globalParticipantCount() {
        Long count = redisTemplate.opsForZSet().zCard(KEY_GLOBAL);
        return count == null ? 0L : count;
    }

    public long categoryParticipantCount(UUID categoryId) {
        Long count = redisTemplate.opsForZSet().zCard(KEY_CAT_PREFIX + categoryId);
        return count == null ? 0L : count;
    }

    public long competitionParticipantCount(UUID competitionId) {
        Long count = redisTemplate.opsForZSet().zCard(KEY_COMP_PREFIX + competitionId);
        return count == null ? 0L : count;
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  BULK SEED (startup hydration)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Bulk-loads entries into the specified ZSET.
     * Used to re-hydrate Redis from the database on application startup.
     */
    public void bulkSeed(String key, Map<String, Double> entries) {
        if (entries.isEmpty()) return;
        Set<ZSetOperations.TypedTuple<String>> tuples = new LinkedHashSet<>();
        entries.forEach((member, score) ->
            tuples.add(ZSetOperations.TypedTuple.of(member, score))
        );
        redisTemplate.opsForZSet().add(key, tuples);
        log.info("Seeded {} entries into Redis ZSET '{}'", tuples.size(), key);
    }

    public String globalKey()        { return KEY_GLOBAL; }
    public String categoryKey(UUID id) { return KEY_CAT_PREFIX + id; }
    public String seasonKey(UUID id)   { return KEY_SEASON_PREFIX + id; }

    // ─────────────────────────────────────────────────────────────────────────
    //  PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private List<Map.Entry<String, Double>> getTopN(String key, int n) {
        Set<ZSetOperations.TypedTuple<String>> raw =
            redisTemplate.opsForZSet().reverseRangeWithScores(key, 0, (long) n - 1);
        if (raw == null) return Collections.emptyList();
        List<Map.Entry<String, Double>> result = new ArrayList<>(raw.size());
        for (ZSetOperations.TypedTuple<String> t : raw) {
            if (t.getValue() != null && t.getScore() != null) {
                result.add(Map.entry(t.getValue(), t.getScore()));
            }
        }
        return result;
    }

    private OptionalInt getRank(String key, UUID userId) {
        // reverseRank returns 0-based index; +1 for 1-based rank
        Long rank = redisTemplate.opsForZSet().reverseRank(key, userId.toString());
        return rank == null ? OptionalInt.empty() : OptionalInt.of((int) (rank + 1));
    }

    private void invalidateTop100Cache(String zsetKey) {
        String cacheKey = "lb:top100:" + zsetKey;
        redisTemplate.delete(cacheKey);
    }
}
