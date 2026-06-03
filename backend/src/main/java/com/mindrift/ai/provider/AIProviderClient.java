package com.mindrift.ai.provider;

import com.mindrift.ai.entity.AIProvider;
import com.mindrift.ai.entity.AIRequestType;

/**
 * Provider-agnostic AI call contract.
 *
 * Every concrete provider (Gemini, OpenAI, Claude, Mock) implements this interface.
 * The AIProviderRouter selects and calls the appropriate provider transparently.
 */
public interface AIProviderClient {

    /**
     * Returns which provider this client represents.
     */
    AIProvider provider();

    /**
     * Returns true if this provider is currently healthy / enabled.
     * Used by the router to skip unavailable providers.
     */
    boolean isAvailable();

    /**
     * Sends a prompt and returns the raw text response.
     *
     * @param request  all parameters needed for the API call
     * @return         raw string response from the provider
     * @throws AIProviderException on API error, timeout, or rate-limit
     */
    AIProviderResponse call(AIProviderRequest request);
}
