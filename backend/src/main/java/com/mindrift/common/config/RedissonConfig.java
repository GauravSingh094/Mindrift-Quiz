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
        
        String finalHost = redisHost;
        int finalPort = redisPort;
        String finalPassword = redisPassword;

        String redisUrl = System.getenv("REDIS_URL");
        if (redisUrl == null) {
            redisUrl = System.getProperty("REDIS_URL");
        }

        if (redisUrl != null && !redisUrl.trim().isEmpty()) {
            try {
                java.net.URI uri = new java.net.URI(redisUrl);
                if (uri.getHost() != null) {
                    finalHost = uri.getHost();
                }
                if (uri.getPort() != -1) {
                    finalPort = uri.getPort();
                }
                if (uri.getUserInfo() != null) {
                    String[] userInfo = uri.getUserInfo().split(":");
                    if (userInfo.length > 1) {
                        finalPassword = userInfo[1];
                    } else if (userInfo.length > 0) {
                        finalPassword = userInfo[0];
                    }
                }
                log.info("Configuring Redisson via REDIS_URL: host={}, port={}", finalHost, finalPort);
            } catch (Exception e) {
                log.error("Failed to parse REDIS_URL: {}", redisUrl, e);
            }
        }

        String address = String.format("redis://%s:%d", finalHost, finalPort);
        config.useSingleServer()
              .setAddress(address)
              .setPassword(finalPassword == null || finalPassword.isEmpty() ? null : finalPassword)
              // Shorter timeouts so startup doesn't hang for 30 seconds
              .setConnectTimeout(3000)
              .setTimeout(3000)
              .setRetryAttempts(1)
              .setRetryInterval(500);
        try {
            RedissonClient client = Redisson.create(config);
            log.info("Redisson connected to Redis at {}:{}", finalHost, finalPort);
            return client;
        } catch (Exception e) {
            log.warn("Redis not available at {}:{} — attempting localhost:6379 fallback. Error: {}", finalHost, finalPort, e.getMessage());
            try {
                Config fallbackConfig = new Config();
                fallbackConfig.useSingleServer()
                      .setAddress("redis://localhost:6379")
                      .setConnectTimeout(1000)
                      .setTimeout(1000)
                      .setRetryAttempts(0);
                return Redisson.create(fallbackConfig);
            } catch (Exception ex) {
                log.error("Local Redis fallback failed. Creating disconnected config. Error: {}", ex.getMessage());
                Config disconnectedConfig = new Config();
                disconnectedConfig.useSingleServer()
                      .setAddress("redis://localhost:6379")
                      .setConnectTimeout(1000)
                      .setTimeout(1000)
                      .setRetryAttempts(0)
                      .setConnectionPoolSize(1)
                      .setConnectionMinimumIdleSize(0);
                return Redisson.create(disconnectedConfig);
            }
        }
    }
}
