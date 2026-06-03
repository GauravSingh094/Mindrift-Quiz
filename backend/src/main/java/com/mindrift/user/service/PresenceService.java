package com.mindrift.user.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PresenceService {

    private final StringRedisTemplate redisTemplate;

    private static final String PRESENCE_KEY_PREFIX = "presence:user:";
    private static final Duration PRESENCE_TTL = Duration.ofSeconds(30);

    public void updateUserPresence(UUID userId) {
        String key = PRESENCE_KEY_PREFIX + userId.toString();
        redisTemplate.opsForValue().set(key, "ONLINE", PRESENCE_TTL);
        log.debug("Updated presence heartbeat online status for user: {}", userId);
    }

    public boolean isUserOnline(UUID userId) {
        String key = PRESENCE_KEY_PREFIX + userId.toString();
        Boolean hasKey = redisTemplate.hasKey(key);
        return Boolean.TRUE.equals(hasKey);
    }

    public long getOnlineUserCount() {
        Set<String> keys = redisTemplate.keys(PRESENCE_KEY_PREFIX + "*");
        return keys != null ? keys.size() : 0L;
    }
}
