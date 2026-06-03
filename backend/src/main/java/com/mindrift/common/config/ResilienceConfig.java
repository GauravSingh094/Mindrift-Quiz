package com.mindrift.common.config;

import io.github.resilience4j.bulkhead.BulkheadConfig;
import io.github.resilience4j.bulkhead.BulkheadRegistry;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.ratelimiter.RateLimiterConfig;
import io.github.resilience4j.ratelimiter.RateLimiterRegistry;
import io.github.resilience4j.retry.RetryConfig;
import io.github.resilience4j.retry.RetryRegistry;
import io.github.resilience4j.timelimiter.TimeLimiterConfig;
import io.github.resilience4j.timelimiter.TimeLimiterRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/**
 * Enterprise Resilience4j Configuration.
 * Initializes registries and predefined configurations for Circuit Breakers, Retries,
 * Rate Limiters, Bulkheads, and Time Limiters protecting all system boundaries.
 */
@Slf4j
@Configuration
public class ResilienceConfig {

    @Bean
    public CircuitBreakerRegistry circuitBreakerRegistry() {
        CircuitBreakerConfig defaultConfig = CircuitBreakerConfig.custom()
                .failureRateThreshold(50) // Trip if >50% fails
                .waitDurationInOpenState(Duration.ofSeconds(10)) // Wait 10s before half-open retry
                .slidingWindowSize(10)
                .minimumNumberOfCalls(5)
                .build();
        
        CircuitBreakerRegistry registry = CircuitBreakerRegistry.of(defaultConfig);
        
        // Register explicit instances
        registry.circuitBreaker("geminiProvider");
        registry.circuitBreaker("openaiProvider");
        registry.circuitBreaker("emailProvider");
        registry.circuitBreaker("storageProvider");
        registry.circuitBreaker("kafkaBroker");
        registry.circuitBreaker("redisCluster");
        
        log.info("Resilience4j: Initialized Circuit Breakers (geminiProvider, openaiProvider, emailProvider, storageProvider, kafkaBroker, redisCluster)");
        return registry;
    }

    @Bean
    public RetryRegistry retryRegistry() {
        RetryConfig defaultConfig = RetryConfig.custom()
                .maxAttempts(3) // 3 total attempts
                .waitDuration(Duration.ofSeconds(1)) // 1s linear/fixed wait
                .build();
        
        RetryRegistry registry = RetryRegistry.of(defaultConfig);
        registry.retry("kafkaProducer");
        registry.retry("emailDispatcher");
        registry.retry("aiRetry");
        
        log.info("Resilience4j: Initialized Retry configurations (kafkaProducer, emailDispatcher, aiRetry)");
        return registry;
    }

    @Bean
    public RateLimiterRegistry rateLimiterRegistry() {
        RateLimiterConfig defaultConfig = RateLimiterConfig.custom()
                .limitRefreshPeriod(Duration.ofMinutes(1))
                .limitForPeriod(100) // 100 requests per minute by default
                .timeoutDuration(Duration.ofMillis(500))
                .build();
        
        RateLimiterRegistry registry = RateLimiterRegistry.of(defaultConfig);
        
        // Define rate limits protecting sensitive routes
        registry.rateLimiter("aiRequests");
        registry.rateLimiter("authEndpoints");
        registry.rateLimiter("notificationEndpoints");
        
        log.info("Resilience4j: Initialized Rate Limiters (aiRequests, authEndpoints, notificationEndpoints)");
        return registry;
    }

    @Bean
    public BulkheadRegistry bulkheadRegistry() {
        BulkheadConfig defaultConfig = BulkheadConfig.custom()
                .maxConcurrentCalls(50) // Max 50 concurrent calls
                .maxWaitDuration(Duration.ofMillis(200)) // Max wait time if bulkhead is full
                .build();

        BulkheadRegistry registry = BulkheadRegistry.of(defaultConfig);
        
        // Isolate concurrent traffic pools
        registry.bulkhead("aiTraffic");
        registry.bulkhead("quizTraffic");
        registry.bulkhead("competitionTraffic");
        registry.bulkhead("notificationTraffic");

        log.info("Resilience4j: Initialized Traffic Bulkheads (aiTraffic, quizTraffic, competitionTraffic, notificationTraffic)");
        return registry;
    }

    @Bean
    public TimeLimiterRegistry timeLimiterRegistry() {
        TimeLimiterConfig defaultConfig = TimeLimiterConfig.custom()
                .timeoutDuration(Duration.ofSeconds(5)) // Default 5s hard timeout
                .cancelRunningFuture(true)
                .build();

        TimeLimiterRegistry registry = TimeLimiterRegistry.of(defaultConfig);
        
        // Protect external dependency limits
        registry.timeLimiter("externalAiLimit");
        registry.timeLimiter("externalEmailLimit");
        registry.timeLimiter("externalStorageLimit");

        log.info("Resilience4j: Initialized Time Limiters (externalAiLimit, externalEmailLimit, externalStorageLimit)");
        return registry;
    }
}
