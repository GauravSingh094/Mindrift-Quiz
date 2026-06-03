package com.mindrift.common.resilience;

import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class ResilientProviderService {

    @CircuitBreaker(name = "geminiProvider", fallbackMethod = "fallbackGemini")
    @Retry(name = "openaiProvider")
    @RateLimiter(name = "aiRequests")
    @Bulkhead(name = "aiTraffic")
    public String callGemini(String prompt) {
        log.info("Dispatched call to Gemini AI provider...");
        // Simulated network contention to verify fallback triggers
        if (System.currentTimeMillis() % 2 == 0) {
            throw new RuntimeException("Gemini provider service timeout exception");
        }
        return "Gemini Response to: " + prompt;
    }

    public String fallbackGemini(String prompt, Throwable t) {
        log.warn("Gemini Circuit Breaker triggered fallback due to exception: {}", t.getMessage());
        return "Gemini fallback response (Static System Buffer)";
    }
}
