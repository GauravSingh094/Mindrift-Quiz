package com.mindrift.ai;

import com.mindrift.ai.entity.AIRequestType;
import com.mindrift.ai.provider.*;
import com.mindrift.ai.provider.impl.MockProviderClient;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit tests for MockProviderClient.
 * Ensures it is always available, returns valid JSON for every request type,
 * and returns consistent token counts.
 */
class MockProviderClientTest {

    private final MockProviderClient mockClient = new MockProviderClient();

    @Test
    void isAvailable_alwaysTrue() {
        assertThat(mockClient.isAvailable()).isTrue();
    }

    @Test
    void provider_returnsMock() {
        assertThat(mockClient.provider()).isEqualTo(com.mindrift.ai.entity.AIProvider.MOCK);
    }

    @ParameterizedTest(name = "requestType={0}")
    @EnumSource(AIRequestType.class)
    void call_allRequestTypes_returnsNonNullResponse(AIRequestType type) {
        AIProviderRequest request = AIProviderRequest.builder()
                .requestType(type)
                .userPrompt("test prompt")
                .temperature(0.7)
                .maxTokens(1024)
                .build();

        AIProviderResponse response = mockClient.call(request);

        assertThat(response).isNotNull();
        assertThat(response.getRawText()).isNotBlank();
        assertThat(response.getTotalTokens()).isPositive();
        assertThat(response.getLatencyMs()).isPositive();
        assertThat(response.getModelUsed()).isNotBlank();
        assertThat(response.getFinishReason()).isNotBlank();
    }

    @Test
    void call_quizGeneration_returnsValidQuizJson() {
        AIProviderRequest request = AIProviderRequest.builder()
                .requestType(AIRequestType.QUIZ_GENERATION)
                .userPrompt("Generate a quiz about Java")
                .temperature(0.7)
                .maxTokens(4096)
                .build();

        AIProviderResponse response = mockClient.call(request);

        assertThat(response.getRawText()).contains("\"title\"");
        assertThat(response.getRawText()).contains("\"questions\"");
        assertThat(response.getRawText()).contains("\"correctOptionIndex\"");
    }

    @Test
    void call_learningPath_containsMilestones() {
        AIProviderRequest request = AIProviderRequest.builder()
                .requestType(AIRequestType.LEARNING_PATH_GENERATION)
                .userPrompt("Create a learning path for Java")
                .temperature(0.6)
                .maxTokens(3000)
                .build();

        AIProviderResponse response = mockClient.call(request);

        assertThat(response.getRawText()).contains("\"milestones\"");
        assertThat(response.getRawText()).contains("\"estimatedHours\"");
    }

    @Test
    void call_interviewFeedback_containsScores() {
        AIProviderRequest request = AIProviderRequest.builder()
                .requestType(AIRequestType.INTERVIEW_FEEDBACK)
                .userPrompt("Final interview feedback")
                .temperature(0.4)
                .maxTokens(2048)
                .build();

        AIProviderResponse response = mockClient.call(request);

        assertThat(response.getRawText()).contains("\"overallScore\"");
        assertThat(response.getRawText()).contains("\"strengths\"");
        assertThat(response.getRawText()).contains("\"improvements\"");
    }
}
