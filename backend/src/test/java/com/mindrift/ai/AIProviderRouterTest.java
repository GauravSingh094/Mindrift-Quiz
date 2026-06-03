package com.mindrift.ai;

import com.mindrift.ai.entity.AIProvider;
import com.mindrift.ai.provider.*;
import com.mindrift.ai.provider.impl.MockProviderClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AIProviderRouter.
 * Verifies fallback chain, preferred-provider routing, and all-fail scenario.
 */
class AIProviderRouterTest {

    private AIProviderClient geminiClient;
    private AIProviderClient openAIClient;
    private AIProviderClient claudeClient;
    private AIProviderClient mockClient;

    private AIProviderRouter router;

    @BeforeEach
    void setUp() {
        geminiClient = mock(AIProviderClient.class);
        openAIClient = mock(AIProviderClient.class);
        claudeClient = mock(AIProviderClient.class);
        mockClient   = new MockProviderClient();

        when(geminiClient.provider()).thenReturn(AIProvider.GEMINI);
        when(openAIClient.provider()).thenReturn(AIProvider.OPENAI);
        when(claudeClient.provider()).thenReturn(AIProvider.CLAUDE);

        router = new AIProviderRouter(
                List.of(geminiClient, openAIClient, claudeClient, mockClient));
    }

    @Test
    void route_geminiAvailable_callsGemini() {
        when(geminiClient.isAvailable()).thenReturn(true);
        when(geminiClient.call(any())).thenReturn(buildResponse(AIProvider.GEMINI));

        AIProviderResponse resp = router.route(buildRequest(), AIProvider.GEMINI);

        assertThat(resp.getProvider()).isEqualTo(AIProvider.GEMINI);
        verify(geminiClient).call(any());
        verify(openAIClient, never()).call(any());
    }

    @Test
    void route_geminiFails_fallsBackToOpenAI() {
        when(geminiClient.isAvailable()).thenReturn(true);
        when(geminiClient.call(any())).thenThrow(
                new AIProviderException(AIProvider.GEMINI, "timeout", true));

        when(openAIClient.isAvailable()).thenReturn(true);
        when(openAIClient.call(any())).thenReturn(buildResponse(AIProvider.OPENAI));

        AIProviderResponse resp = router.route(buildRequest(), AIProvider.GEMINI);

        assertThat(resp.getProvider()).isEqualTo(AIProvider.OPENAI);
        verify(geminiClient).call(any());
        verify(openAIClient).call(any());
    }

    @Test
    void route_geminiAndOpenAIFail_fallsBackToClaude() {
        when(geminiClient.isAvailable()).thenReturn(true);
        when(geminiClient.call(any())).thenThrow(
                new AIProviderException(AIProvider.GEMINI, "error", true));

        when(openAIClient.isAvailable()).thenReturn(true);
        when(openAIClient.call(any())).thenThrow(
                new AIProviderException(AIProvider.OPENAI, "error", true));

        when(claudeClient.isAvailable()).thenReturn(true);
        when(claudeClient.call(any())).thenReturn(buildResponse(AIProvider.CLAUDE));

        AIProviderResponse resp = router.route(buildRequest(), AIProvider.GEMINI);

        assertThat(resp.getProvider()).isEqualTo(AIProvider.CLAUDE);
    }

    @Test
    void route_allRealProvidersFail_fallsBackToMock() {
        when(geminiClient.isAvailable()).thenReturn(false);
        when(openAIClient.isAvailable()).thenReturn(false);
        when(claudeClient.isAvailable()).thenReturn(false);
        // mockClient.isAvailable() always returns true

        AIProviderResponse resp = router.route(buildRequest(), AIProvider.GEMINI);

        assertThat(resp.getProvider()).isEqualTo(AIProvider.MOCK);
    }

    @Test
    void route_preferredOpenAI_callsOpenAIFirst() {
        when(openAIClient.isAvailable()).thenReturn(true);
        when(openAIClient.call(any())).thenReturn(buildResponse(AIProvider.OPENAI));

        AIProviderResponse resp = router.route(buildRequest(), AIProvider.OPENAI);

        assertThat(resp.getProvider()).isEqualTo(AIProvider.OPENAI);
        verify(geminiClient, never()).call(any());
        verify(openAIClient).call(any());
    }

    @Test
    void route_noKeyConfigured_skipProvider() {
        when(geminiClient.isAvailable()).thenReturn(false); // no API key
        when(openAIClient.isAvailable()).thenReturn(true);
        when(openAIClient.call(any())).thenReturn(buildResponse(AIProvider.OPENAI));

        AIProviderResponse resp = router.route(buildRequest()); // default: GEMINI preferred

        assertThat(resp.getProvider()).isEqualTo(AIProvider.OPENAI);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private AIProviderRequest buildRequest() {
        return AIProviderRequest.builder()
                .requestType(com.mindrift.ai.entity.AIRequestType.QUIZ_GENERATION)
                .userPrompt("Generate a quiz about Java")
                .temperature(0.7)
                .maxTokens(4096)
                .build();
    }

    private AIProviderResponse buildResponse(AIProvider provider) {
        return AIProviderResponse.builder()
                .provider(provider)
                .rawText("{\"title\":\"Test Quiz\"}")
                .promptTokens(100)
                .completionTokens(200)
                .totalTokens(300)
                .latencyMs(200L)
                .finishReason("stop")
                .modelUsed("test-model")
                .build();
    }
}
