package com.mindrift.ai.provider;

import com.mindrift.ai.entity.AIProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Provider Router — selects the best available provider and calls it,
 * with automatic fallback through the priority chain:
 *
 *   GEMINI → OPENAI → CLAUDE → MOCK
 *
 * If the preferred provider is unavailable (circuit open, no API key),
 * the router tries the next provider in the chain.
 *
 * This component is the single point of truth for all AI calls.
 * Services never call provider clients directly.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AIProviderRouter {

    /** Priority-ordered list; Spring injects all AIProviderClient beans. */
    private final List<AIProviderClient> providers;

    /** Priority order for routing */
    private static final List<AIProvider> PRIORITY = List.of(
            AIProvider.GEMINI, AIProvider.OPENAI, AIProvider.CLAUDE, AIProvider.MOCK
    );

    /**
     * Routes the request to the first available provider.
     * Falls back through the chain on AIProviderException.
     *
     * @param request  the unified provider request
     * @param preferred  preferred provider (use GEMINI for default)
     * @return provider response from the first successful call
     * @throws AIProviderException if ALL providers fail
     */
    public AIProviderResponse route(AIProviderRequest request, AIProvider preferred) {
        // Build ordered list starting with preferred
        List<AIProvider> order = buildOrder(preferred);

        Throwable lastException = null;

        for (AIProvider providerType : order) {
            AIProviderClient client = findClient(providerType);
            if (client == null || !client.isAvailable()) {
                log.debug("Provider {} not available, trying next", providerType);
                continue;
            }

            try {
                log.debug("Routing AI request to provider={}", providerType);
                AIProviderResponse response = client.call(request);
                log.info("AI request completed: provider={} tokens={} latencyMs={}",
                        response.getProvider(), response.getTotalTokens(), response.getLatencyMs());
                return response;
            } catch (AIProviderException ex) {
                log.warn("Provider {} failed: {}. Trying fallback.", providerType, ex.getMessage());
                lastException = ex;
            } catch (Exception ex) {
                log.warn("Unexpected error from provider {}: {}", providerType, ex.getMessage());
                lastException = ex;
            }
        }

        throw new AIProviderException(AIProvider.MOCK,
                "All AI providers failed. Last error: "
                        + (lastException != null ? lastException.getMessage() : "unknown"),
                lastException, false);
    }

    /** Convenience: route with GEMINI as default preferred provider */
    public AIProviderResponse route(AIProviderRequest request) {
        return route(request, AIProvider.GEMINI);
    }

    // ─── Private ─────────────────────────────────────────────────────────────

    private List<AIProvider> buildOrder(AIProvider preferred) {
        List<AIProvider> order = new java.util.ArrayList<>(PRIORITY);
        order.remove(preferred);
        order.add(0, preferred); // put preferred first
        return order;
    }

    private AIProviderClient findClient(AIProvider type) {
        return providers.stream()
                .filter(c -> c.provider() == type)
                .findFirst()
                .orElse(null);
    }
}
