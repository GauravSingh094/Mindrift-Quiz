package com.mindrift.ai.entity;

/**
 * Supported AI providers.
 * Priority order for fallback: GEMINI → OPENAI → CLAUDE
 */
public enum AIProvider {
    GEMINI,
    OPENAI,
    CLAUDE,
    MOCK  // local fallback for tests / dev
}
