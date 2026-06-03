package com.mindrift.quiz.session;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

/**
 * Manages AttemptSession lifecycle in Redis.
 * Provides atomic read/write/delete operations with automatic TTL.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AttemptSessionService {

    private static final String SESSION_KEY_PREFIX  = "mindrift:attempts:session:";
    private static final String ACTIVE_KEY_PREFIX   = "mindrift:attempts:active:id:";
    private static final long   GRACE_BUFFER_SECS   = 300L; // 5min grace after timer expires

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    // ─────────────────────────────────────────────────────────────────
    //  WRITE
    // ─────────────────────────────────────────────────────────────────

    public void saveSession(AttemptSession session) {
        String key = sessionKey(session.getAttemptId());
        long ttl   = session.getRemainingSeconds() + GRACE_BUFFER_SECS;
        try {
            String json = objectMapper.writeValueAsString(session);
            redisTemplate.opsForValue().set(key, json, Duration.ofSeconds(Math.max(ttl, GRACE_BUFFER_SECS)));
            // Also update the simple active marker
            redisTemplate.opsForValue().set(ACTIVE_KEY_PREFIX + session.getAttemptId(), "ACTIVE",
                    Duration.ofSeconds(Math.max(ttl, GRACE_BUFFER_SECS)));
            log.debug("Saved attempt session {} to Redis (TTL={}s)", session.getAttemptId(), ttl);
        } catch (Exception e) {
            log.error("Failed to save attempt session {} to Redis", session.getAttemptId(), e);
            // Non-fatal: fall through to DB for resilience
        }
    }

    // ─────────────────────────────────────────────────────────────────
    //  READ
    // ─────────────────────────────────────────────────────────────────

    public Optional<AttemptSession> loadSession(UUID attemptId) {
        String key = sessionKey(attemptId);
        try {
            String json = redisTemplate.opsForValue().get(key);
            if (json == null) return Optional.empty();
            return Optional.of(objectMapper.readValue(json, AttemptSession.class));
        } catch (Exception e) {
            log.warn("Failed to load attempt session {} from Redis; falling back to DB", attemptId, e);
            return Optional.empty();
        }
    }

    // ─────────────────────────────────────────────────────────────────
    //  DELETE (on finalization)
    // ─────────────────────────────────────────────────────────────────

    public void evictSession(UUID attemptId) {
        redisTemplate.delete(sessionKey(attemptId));
        redisTemplate.delete(ACTIVE_KEY_PREFIX + attemptId);
        log.debug("Evicted attempt session {} from Redis", attemptId);
    }

    // ─────────────────────────────────────────────────────────────────
    //  UTILITY
    // ─────────────────────────────────────────────────────────────────

    public boolean isSessionActive(UUID attemptId) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(sessionKey(attemptId)));
    }

    private String sessionKey(UUID attemptId) {
        return SESSION_KEY_PREFIX + attemptId;
    }
}
