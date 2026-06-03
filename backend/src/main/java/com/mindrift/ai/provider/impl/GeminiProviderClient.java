package com.mindrift.ai.provider.impl;

import com.mindrift.ai.entity.AIProvider;
import com.mindrift.ai.provider.*;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * Google Gemini provider client.
 *
 * Uses the Gemini REST API (generateContent endpoint).
 * Models: gemini-1.5-pro, gemini-1.5-flash, gemini-pro
 *
 * Protected by Resilience4j:
 *   - CircuitBreaker: geminiProvider
 *   - Retry: geminiProvider (3 attempts with exponential backoff)
 *   - RateLimiter: aiRequests (shared with all providers)
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "mindrift.ai.gemini.enabled", havingValue = "true", matchIfMissing = true)
public class GeminiProviderClient implements AIProviderClient {

    private static final String BASE_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";

    @Value("${mindrift.ai.gemini.api-key:#{null}}")
    private String apiKey;

    @Value("${mindrift.ai.gemini.model:gemini-1.5-flash}")
    private String defaultModel;

    @Value("${mindrift.ai.gemini.enabled:true}")
    private boolean enabled;

    private final RestTemplate restTemplate;

    public GeminiProviderClient() {
        this.restTemplate = new RestTemplate();
    }

    @Override
    public AIProvider provider() { return AIProvider.GEMINI; }

    @Override
    public boolean isAvailable() {
        return enabled && apiKey != null && !apiKey.isBlank();
    }

    @Override
    @CircuitBreaker(name = "geminiProvider", fallbackMethod = "fallback")
    @Retry(name = "geminiProvider")
    @RateLimiter(name = "aiRequests")
    public AIProviderResponse call(AIProviderRequest request) {
        if (!isAvailable()) {
            throw new AIProviderException(AIProvider.GEMINI,
                    "Gemini API key not configured", false);
        }

        long start = System.currentTimeMillis();
        String model = request.getModelId() != null ? request.getModelId() : defaultModel;
        String url   = String.format(BASE_URL, model, apiKey);

        // Build Gemini request body
        Map<String, Object> body = buildRequestBody(request);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    url, HttpMethod.POST, new HttpEntity<>(body, headers), Map.class);

            long latency = System.currentTimeMillis() - start;

            return parseGeminiResponse(response.getBody(), model, latency);

        } catch (Exception ex) {
            log.error("Gemini API call failed: {}", ex.getMessage());
            throw new AIProviderException(AIProvider.GEMINI,
                    "Gemini API error: " + ex.getMessage(), ex, true);
        }
    }

    @SuppressWarnings("unused")
    public AIProviderResponse fallback(AIProviderRequest request, Throwable t) {
        log.warn("Gemini circuit breaker fallback triggered: {}", t.getMessage());
        throw new AIProviderException(AIProvider.GEMINI,
                "Gemini unavailable (circuit open): " + t.getMessage(), false);
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private Map<String, Object> buildRequestBody(AIProviderRequest request) {
        String fullPrompt = request.getUserPrompt();
        if (request.getSystemPrompt() != null && !request.getSystemPrompt().isBlank()) {
            fullPrompt = "System: " + request.getSystemPrompt() + "\n\nUser: " + request.getUserPrompt();
        }

        return Map.of(
            "contents", List.of(
                Map.of("parts", List.of(Map.of("text", fullPrompt)))
            ),
            "generationConfig", Map.of(
                "temperature",    request.getTemperature(),
                "maxOutputTokens", request.getMaxTokens(),
                "responseMimeType", "application/json"
            )
        );
    }

    @SuppressWarnings("unchecked")
    private AIProviderResponse parseGeminiResponse(Map<String, Object> body,
                                                    String model, long latencyMs) {
        try {
            List<Map<String, Object>> candidates =
                    (List<Map<String, Object>>) body.get("candidates");
            Map<String, Object> first = candidates.get(0);
            Map<String, Object> content = (Map<String, Object>) first.get("content");
            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
            String text = (String) parts.get(0).get("text");

            Map<String, Object> usage = (Map<String, Object>) body.getOrDefault(
                    "usageMetadata", Map.of());
            int promptTokens     = ((Number) usage.getOrDefault("promptTokenCount", 0)).intValue();
            int completionTokens = ((Number) usage.getOrDefault("candidatesTokenCount", 0)).intValue();

            String finishReason = (String) first.getOrDefault("finishReason", "STOP");

            return AIProviderResponse.builder()
                    .provider(AIProvider.GEMINI)
                    .rawText(text)
                    .promptTokens(promptTokens)
                    .completionTokens(completionTokens)
                    .totalTokens(promptTokens + completionTokens)
                    .latencyMs(latencyMs)
                    .finishReason(finishReason)
                    .modelUsed(model)
                    .build();

        } catch (Exception e) {
            throw new AIProviderException(AIProvider.GEMINI,
                    "Failed to parse Gemini response: " + e.getMessage(), e, false);
        }
    }
}
