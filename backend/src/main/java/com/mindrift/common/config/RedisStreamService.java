package com.mindrift.common.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.stream.ObjectRecord;
import org.springframework.data.redis.connection.stream.StreamRecords;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class RedisStreamService {

    private final StringRedisTemplate redisTemplate;

    public void publishToStream(String streamKey, Map<String, String> payload) {
        try {
            log.debug("Publishing record telemetry to Redis Stream: {}", streamKey);
            ObjectRecord<String, Map<String, String>> record = StreamRecords.newRecord()
                    .in(streamKey)
                    .ofObject(payload);
            redisTemplate.opsForStream().add(record);
            log.debug("Telemetry record added successfully to Redis Stream '{}'", streamKey);
        } catch (Exception e) {
            log.error("Failed to publish to Redis Stream: {}", streamKey, e);
        }
    }
}
