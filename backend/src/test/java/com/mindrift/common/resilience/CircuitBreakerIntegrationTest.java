package com.mindrift.common.resilience;

import com.mindrift.BaseIntegrationTest;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.junit.jupiter.api.Assertions.*;

public class CircuitBreakerIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private ResilientProviderService resilientProviderService;

    @Autowired
    private CircuitBreakerRegistry circuitBreakerRegistry;

    private CircuitBreaker geminiCircuitBreaker;

    @BeforeEach
    void setUp() {
        geminiCircuitBreaker = circuitBreakerRegistry.circuitBreaker("geminiProvider");
        geminiCircuitBreaker.reset();
    }

    @Test
    void testCircuitBreakerFlowAndFallback() {
        // Assert initial state is CLOSED
        assertEquals(CircuitBreaker.State.CLOSED, geminiCircuitBreaker.getState());

        // Repeatedly invoke to force failures or invoke fallback
        for (int i = 0; i < 20; i++) {
            String response = resilientProviderService.callGemini("Hello Test " + i);
            assertNotNull(response);
            // Response must be either the positive response or the fallback response
            assertTrue(response.contains("Gemini Response to:") || response.contains("Gemini fallback response"));
        }
    }
}
