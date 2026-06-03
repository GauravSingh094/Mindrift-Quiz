package com.mindrift.ai.provider;

import com.mindrift.ai.entity.AIProvider;

/**
 * Thrown when an AI provider call fails unrecoverably.
 * The AIProviderRouter catches this and falls back to the next provider.
 */
public class AIProviderException extends RuntimeException {

    private final AIProvider provider;
    private final boolean retriable;

    public AIProviderException(AIProvider provider, String message, boolean retriable) {
        super(message);
        this.provider  = provider;
        this.retriable = retriable;
    }

    public AIProviderException(AIProvider provider, String message, Throwable cause, boolean retriable) {
        super(message, cause);
        this.provider  = provider;
        this.retriable = retriable;
    }

    public AIProvider getProvider()  { return provider; }
    public boolean    isRetriable()  { return retriable; }
}
