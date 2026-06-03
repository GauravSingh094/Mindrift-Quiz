package com.mindrift.common.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableCaching
public class RedisUpgradeConfig {

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofHours(1))
                .disableCachingNullValues()
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer()));

        // Different TTL setups for different namespaces
        Map<String, RedisCacheConfiguration> configurations = new HashMap<>();
        configurations.put("quizzes",               defaultConfig.entryTtl(Duration.ofHours(12)));
        configurations.put("leaderboard",           defaultConfig.entryTtl(Duration.ofMinutes(10)));
        configurations.put("user-profiles",         defaultConfig.entryTtl(Duration.ofHours(2)));
        // ─── Analytics caches ─────────────────────────────────────────────
        configurations.put("analytics-user",        defaultConfig.entryTtl(Duration.ofMinutes(5)));
        configurations.put("analytics-quiz",        defaultConfig.entryTtl(Duration.ofMinutes(10)));
        configurations.put("analytics-competition", defaultConfig.entryTtl(Duration.ofMinutes(30)));
        configurations.put("analytics-skill",       defaultConfig.entryTtl(Duration.ofMinutes(15)));
        // ─── AI caches ────────────────────────────────────────────────────────
        configurations.put("ai-explanations",         defaultConfig.entryTtl(Duration.ofHours(24)));
        configurations.put("ai-recommendations",      defaultConfig.entryTtl(Duration.ofHours(24)));
        configurations.put("ai-skill-gaps",           defaultConfig.entryTtl(Duration.ofHours(6)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(configurations)
                .build();
    }

    @Bean
    public RedisMessageListenerContainer redisMessageListenerContainer(RedisConnectionFactory connectionFactory) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        return container;
    }
}
