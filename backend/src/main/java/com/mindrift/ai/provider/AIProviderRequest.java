package com.mindrift.ai.provider;

import com.mindrift.ai.entity.AIRequestType;
import lombok.Builder;
import lombok.Value;

/**
 * Unified request object passed to any AIProviderClient.
 * Contains all parameters needed to make a complete API call.
 */
@Value
@Builder
public class AIProviderRequest {

    AIRequestType requestType;

    String systemPrompt;
    String userPrompt;

    /** Provider-specific model identifier */
    String modelId;

    double temperature;
    int maxTokens;

    /** Optional JSON context injected into prompt (for structured outputs) */
    String contextJson;
}
