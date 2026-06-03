package com.mindrift.ai.provider;

import com.mindrift.ai.entity.AIProvider;
import lombok.Builder;
import lombok.Value;

/**
 * Unified response object returned by any AIProviderClient.
 */
@Value
@Builder
public class AIProviderResponse {

    AIProvider provider;

    String rawText;
    String parsedJson;

    int promptTokens;
    int completionTokens;
    int totalTokens;

    long latencyMs;

    /** Provider-assigned finish reason (stop, length, content_filter, etc.) */
    String finishReason;

    /** Model ID actually used (may differ from requested if provider auto-routes) */
    String modelUsed;
}
