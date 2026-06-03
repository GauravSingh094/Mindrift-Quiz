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
 * Anthropic Claude provider client.
 *
 * Uses the Anthropic Messages API.
 * Models: claude-3-5-sonnet, claude-3-haiku
 *
 * Protected by Resilience4j:
 *   - CircuitBreaker: claudeProvider
 *   - Retry: claudeProvider
 *   - RateLimiter: aiRequests (shared)
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "mindrift.ai.claude.enabled", havingValue = "true", matchIfMissing = true)
public class ClaudeProviderClient implements AIProviderClient {

    private static final String BASE_URL      = "https://api.anthropic.com/v1/messages";
    private static final String ANTHROPIC_VER = "2023-06-01";

    @Value("${mindrift.ai.claude.api-key:#{null}}")
    private String apiKey;

    @Value("${mindrift.ai.claude.model:claude-3-haiku-20240307}")
    private String defaultModel;

    @Value("${mindrift.ai.claude.enabled:true}")
    private boolean enabled;

    private final RestTemplate restTemplate;

    public ClaudeProviderClient() {
        this.restTemplate = new RestTemplate();
    }

    @Override
    public AIProvider provider() { return AIProvider.CLAUDE; }

    @Override
    public boolean isAvailable() {
        return enabled && apiKey != null && !apiKey.isBlank();
    }

    @Override
    @CircuitBreaker(name = "claudeProvider", fallbackMethod = "fallback")
    @Retry(name = "claudeProvider")
    @RateLimiter(name = "aiRequests")
    public AIProviderResponse call(AIProviderRequest request) {
        if (!isAvailable()) {
            throw new AIProviderException(AIProvider.CLAUDE,
                    "Claude API key not configured", false);
        }

        long start = System.currentTimeMillis();
        String model = request.getModelId() != null ? request.getModelId() : defaultModel;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", apiKey);
        headers.set("anthropic-version", ANTHROPIC_VER);

        Map<String, Object> body = buildRequestBody(request, model);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    BASE_URL, HttpMethod.POST, new HttpEntity<>(body, headers), Map.class);

            long latency = System.currentTimeMillis() - start;
            return parseClaudeResponse(response.getBody(), model, latency);

        } catch (Exception ex) {
            log.error("Claude API call failed: {}", ex.getMessage());
            throw new AIProviderException(AIProvider.CLAUDE,
                    "Claude API error: " + ex.getMessage(), ex, true);
        }
    }

    @SuppressWarnings("unused")
    public AIProviderResponse fallback(AIProviderRequest request, Throwable t) {
        log.warn("Claude circuit breaker fallback: {}", t.getMessage());
        throw new AIProviderException(AIProvider.CLAUDE,
                "Claude unavailable (circuit open): " + t.getMessage(), false);
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    private Map<String, Object> buildRequestBody(AIProviderRequest request, String model) {
        String userContent = request.getUserPrompt();
        // Append JSON instruction for structured output
        userContent += "\n\nRespond ONLY with valid JSON. No markdown, no explanation.";

        Map<String, Object> bodyMap = new java.util.HashMap<>();
        bodyMap.put("model",      model);
        bodyMap.put("max_tokens", request.getMaxTokens());
        bodyMap.put("messages",   List.of(Map.of("role", "user", "content", userContent)));
        if (request.getSystemPrompt() != null && !request.getSystemPrompt().isBlank()) {
            bodyMap.put("system", request.getSystemPrompt());
        }
        return bodyMap;
    }

    @SuppressWarnings("unchecked")
    private AIProviderResponse parseClaudeResponse(Map<String, Object> body,
                                                    String model, long latencyMs) {
        try {
            List<Map<String, Object>> content =
                    (List<Map<String, Object>>) body.get("content");
            String text = (String) content.get(0).get("text");
            String stopReason = (String) body.getOrDefault("stop_reason", "end_turn");

            Map<String, Object> usage = (Map<String, Object>) body.getOrDefault("usage", Map.of());
            int inputTokens  = ((Number) usage.getOrDefault("input_tokens", 0)).intValue();
            int outputTokens = ((Number) usage.getOrDefault("output_tokens", 0)).intValue();

            return AIProviderResponse.builder()
                    .provider(AIProvider.CLAUDE)
                    .rawText(text)
                    .promptTokens(inputTokens)
                    .completionTokens(outputTokens)
                    .totalTokens(inputTokens + outputTokens)
                    .latencyMs(latencyMs)
                    .finishReason(stopReason)
                    .modelUsed(model)
                    .build();

        } catch (Exception e) {
            throw new AIProviderException(AIProvider.CLAUDE,
                    "Failed to parse Claude response: " + e.getMessage(), e, false);
        }
    }
}
