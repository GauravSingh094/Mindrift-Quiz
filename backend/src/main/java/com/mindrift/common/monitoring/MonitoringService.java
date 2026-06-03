package com.mindrift.common.monitoring;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Enterprise Monitoring and Telemetry Service.
 * Publishes operational metric gauges, counters, and timers to Prometheus via Micrometer.
 */
@Service
public class MonitoringService {

    private final MeterRegistry meterRegistry;
    private final Timer databaseTimer;
    private final Timer redisTimer;

    private final AtomicLong activeWebsocketConnections = new AtomicLong(0);
    private final AtomicLong activeOnlineUsers = new AtomicLong(0);
    private final AtomicLong outboxBacklog = new AtomicLong(0);
    private final AtomicLong dlqSize = new AtomicLong(0);
    private final AtomicLong kafkaConsumerLag = new AtomicLong(0);

    public MonitoringService(MeterRegistry registry) {
        this.meterRegistry = registry;
        
        this.databaseTimer = Timer.builder("mindrift.db.latency")
                .description("Latency of database operations")
                .register(registry);

        this.redisTimer = Timer.builder("mindrift.redis.latency")
                .description("Latency of Redis operations")
                .register(registry);

        // Register custom Gauges
        registry.gauge("mindrift.websocket.active.connections", activeWebsocketConnections);
        registry.gauge("mindrift.presence.active.users", activeOnlineUsers);
        registry.gauge("mindrift.outbox.backlog.size", outboxBacklog);
        registry.gauge("mindrift.dlq.backlog.size", dlqSize);
        registry.gauge("mindrift.kafka.consumer.lag", kafkaConsumerLag);
    }

    public void recordDatabaseLatency(long durationMs) {
        databaseTimer.record(durationMs, TimeUnit.MILLISECONDS);
    }

    public void recordRedisLatency(long durationMs) {
        redisTimer.record(durationMs, TimeUnit.MILLISECONDS);
    }

    public void incrementAiRequest(String provider, String status) {
        Counter.builder("mindrift.ai.requests.total")
                .description("Total AI requests dispatched")
                .tags("provider", provider, "status", status)
                .register(meterRegistry)
                .increment();
    }

    public void recordAiTokenUsage(String provider, String tokenType, long count) {
        Counter.builder("mindrift.ai.tokens.total")
                .description("Total AI tokens consumed")
                .tags("provider", provider, "type", tokenType)
                .register(meterRegistry)
                .increment(count);
    }

    public void incrementKafkaPublish(String topic, String status) {
        Counter.builder("mindrift.kafka.publishes.total")
                .description("Total Kafka publishes dispatched")
                .tags("topic", topic, "status", status)
                .register(meterRegistry)
                .increment();
    }

    public void incrementKafkaConsume(String topic, String consumerGroup) {
        Counter.builder("mindrift.kafka.consumes.total")
                .description("Total Kafka messages consumed")
                .tags("topic", topic, "consumer_group", consumerGroup)
                .register(meterRegistry)
                .increment();
    }

    public void setKafkaConsumerLag(long count) {
        kafkaConsumerLag.set(count);
    }

    public void setWebSocketActiveConnections(long count) {
        activeWebsocketConnections.set(count);
    }

    public void setOnlineUserCount(long count) {
        activeOnlineUsers.set(count);
    }

    public void setOutboxBacklog(long count) {
        outboxBacklog.set(count);
    }

    public void setDlqSize(long count) {
        dlqSize.set(count);
    }

    public void recordPermissionCacheHit() {
        Counter.builder("mindrift.permission.cache.hits")
                .description("Total RBAC permission cache hits")
                .register(meterRegistry)
                .increment();
    }

    public void recordPermissionCacheMiss() {
        Counter.builder("mindrift.permission.cache.misses")
                .description("Total RBAC permission cache misses")
                .register(meterRegistry)
                .increment();
    }

    public void recordCircuitBreakerState(String name, String state) {
        Counter.builder("mindrift.resilience.circuitbreaker.state.changes")
                .description("Circuit breaker state transitions")
                .tags("name", name, "state", state)
                .register(meterRegistry)
                .increment();
    }

    public void recordRetryAttempt(String name) {
        Counter.builder("mindrift.resilience.retries.total")
                .description("Total Resilience retry attempts executed")
                .tags("name", name)
                .register(meterRegistry)
                .increment();
    }

    public void incrementStorageUpload(String provider, String status) {
        Counter.builder("mindrift.storage.uploads.total")
                .description("Total file uploads dispatched")
                .tags("provider", provider, "status", status)
                .register(meterRegistry)
                .increment();
    }

    public void incrementStorageDownload(String provider, String status) {
        Counter.builder("mindrift.storage.downloads.total")
                .description("Total file downloads dispatched")
                .tags("provider", provider, "status", status)
                .register(meterRegistry)
                .increment();
    }

    public void incrementStorageDelete(String provider, String status) {
        Counter.builder("mindrift.storage.deletions.total")
                .description("Total file deletions dispatched")
                .tags("provider", provider, "status", status)
                .register(meterRegistry)
                .increment();
    }

    public void recordStorageLatency(String provider, String operation, long durationMs) {
        Timer.builder("mindrift.storage.latency")
                .description("Latency of storage operations")
                .tags("provider", provider, "operation", operation)
                .register(meterRegistry)
                .record(durationMs, TimeUnit.MILLISECONDS);
    }
}
