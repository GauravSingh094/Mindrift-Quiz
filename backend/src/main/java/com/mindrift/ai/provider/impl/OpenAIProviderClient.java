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
 * OpenAI ChatGPT provider client.
 *
 * Uses the OpenAI Chat Completions API.
 * Models: gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo
 *
 * Protected by Resilience4j:
 *   - CircuitBreaker: openaiProvider
 *   - Retry: openaiProvider (3 attempts)
 *   - RateLimiter: aiRequests (shared)
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "mindrift.ai.openai.enabled", havingValue = "true", matchIfMissing = true)
public class OpenAIProviderClient implements AIProviderClient {

    private static final String BASE_URL = "https://api.openai.com/v1/chat/completions";

    @Value("${mindrift.ai.openai.api-key:#{null}}")
    private String apiKey;

    @Value("${mindrift.ai.openai.model:gpt-4o-mini}")
    private String defaultModel;

    @Value("${mindrift.ai.openai.enabled:true}")
    private boolean enabled;

    private final RestTemplate restTemplate;

    public OpenAIProviderClient() {
        this.restTemplate = new RestTemplate();
    }

    @Override
    public AIProvider provider() { return AIProvider.OPENAI; }

    @Override
    public boolean isAvailable() {
        return enabled && apiKey != null && !apiKey.isBlank();
    }

    @Override
    @CircuitBreaker(name = "openaiProvider", fallbackMethod = "fallback")
    @Retry(name = "openaiProvider")
    @RateLimiter(name = "aiRequests")
    public AIProviderResponse call(AIProviderRequest request) {
        if (!isAvailable()) {
            throw new AIProviderException(AIProvider.OPENAI,
                    "OpenAI API key not configured", false);
        }

        long start = System.currentTimeMillis();
        String model = request.getModelId() != null ? request.getModelId() : defaultModel;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        Map<String, Object> body = buildRequestBody(request, model);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    BASE_URL, HttpMethod.POST, new HttpEntity<>(body, headers), Map.class);

            long latency = System.currentTimeMillis() - start;
            return parseOpenAIResponse(response.getBody(), model, latency);

        } catch (Exception ex) {
            log.error("OpenAI API call failed: {}", ex.getMessage());
            throw new AIProviderException(AIProvider.OPENAI,
                    "OpenAI API error: " + ex.getMessage(), ex, true);
        }
    }

    @SuppressWarnings("unused")
    public AIProviderResponse fallback(AIProviderRequest request, Throwable t) {
        log.warn("OpenAI circuit breaker fallback: {}", t.getMessage());
        throw new AIProviderException(AIProvider.OPENAI,
                "OpenAI unavailable (circuit open): " + t.getMessage(), false);
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    private Map<String, Object> buildRequestBody(AIProviderRequest request, String model) {
        List<Map<String, Object>> messages = new java.util.ArrayList<>();
        if (request.getSystemPrompt() != null && !request.getSystemPrompt().isBlank()) {
            messages.add(Map.of("role", "system", "content", request.getSystemPrompt()));
        }
        messages.add(Map.of("role", "user", "content", request.getUserPrompt()));

        Map<String, Object> body = new java.util.HashMap<>();
        body.put("model",       model);
        body.put("messages",    messages);
        body.put("temperature", request.getTemperature());
        body.put("max_tokens",  request.getMaxTokens());

        // Only enforce JSON response format if prompt explicitly requests it, resolving 400 Bad Request crashes
        String fullPrompt = (request.getSystemPrompt() != null ? request.getSystemPrompt() : "") + " " + request.getUserPrompt();
        if (fullPrompt.toLowerCase().contains("json")) {
            body.put("response_format", Map.of("type", "json_object"));
        }

        return body;
    }

    @SuppressWarnings("unchecked")
    private AIProviderResponse parseOpenAIResponse(Map<String, Object> body,
                                                    String model, long latencyMs) {
        try {
            List<Map<String, Object>> choices =
                    (List<Map<String, Object>>) body.get("choices");
            Map<String, Object> first   = choices.get(0);
            Map<String, Object> message = (Map<String, Object>) first.get("message");
            String content = (String) message.get("content");
            String finish  = (String) first.getOrDefault("finish_reason", "stop");

            Map<String, Object> usage = (Map<String, Object>) body.getOrDefault("usage", Map.of());
            int promptTokens     = ((Number) usage.getOrDefault("prompt_tokens", 0)).intValue();
            int completionTokens = ((Number) usage.getOrDefault("completion_tokens", 0)).intValue();

            return AIProviderResponse.builder()
                    .provider(AIProvider.OPENAI)
                    .rawText(content)
                    .promptTokens(promptTokens)
                    .completionTokens(completionTokens)
                    .totalTokens(promptTokens + completionTokens)
                    .latencyMs(latencyMs)
                    .finishReason(finish)
                    .modelUsed(model)
                    .build();

        } catch (Exception e) {
            throw new AIProviderException(AIProvider.OPENAI,
                    "Failed to parse OpenAI response: " + e.getMessage(), e, false);
        }
    }
}
