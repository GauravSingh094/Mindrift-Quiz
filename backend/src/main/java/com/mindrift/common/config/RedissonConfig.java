package com.mindrift.common.config;

import lombok.extern.slf4j.Slf4j;
import org.redisson.Redisson;
import org.redisson.api.RedissonClient;
import org.redisson.config.Config;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
public class RedissonConfig {

    @Value("${spring.data.redis.host:localhost}")
    private String redisHost;

    @Value("${spring.data.redis.port:6379}")
    private int redisPort;

    @Value("${spring.data.redis.password:}")
    private String redisPassword;

    @Bean
    public RedissonClient redissonClient() {
        Config config = new Config();
        String address = String.format("redis://%s:%d", redisHost, redisPort);
        config.useSingleServer()
              .setAddress(address)
              .setPassword(redisPassword.isEmpty() ? null : redisPassword)
              // Shorter timeouts so startup doesn't hang for 30 seconds
              .setConnectTimeout(3000)
              .setTimeout(3000)
              .setRetryAttempts(1)
              .setRetryInterval(500);
        try {
            RedissonClient client = Redisson.create(config);
            log.info("Redisson connected to Redis at {}:{}", redisHost, redisPort);
            return client;
        } catch (Exception e) {
            log.warn("Redis not available at {}:{} — distributed locking disabled. " +
                     "Sessions will use in-memory fallback. Error: {}", redisHost, redisPort, e.getMessage());
            // Return a no-op / disconnected client that won't block startup
            config.useSingleServer()
                  .setAddress(address)
                  .setPassword(redisPassword.isEmpty() ? null : redisPassword)
                  .setConnectTimeout(1000)
                  .setTimeout(1000)
                  .setRetryAttempts(0)
                  .setConnectionPoolSize(1)
                  .setConnectionMinimumIdleSize(0);
            // We still create the client — Redisson handles reconnection automatically
            return Redisson.create(config);
        }
    }
}
