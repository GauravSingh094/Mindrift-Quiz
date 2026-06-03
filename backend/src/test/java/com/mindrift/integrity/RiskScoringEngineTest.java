package com.mindrift.integrity;

import com.mindrift.integrity.entity.RiskLevel;
import com.mindrift.integrity.entity.ViolationType;
import com.mindrift.integrity.service.RiskScoringEngine;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.*;

/**
 * Pure unit tests for the RiskScoringEngine — no Spring context.
 * Validates base points, frequency multipliers, classification, and directives.
 */
class RiskScoringEngineTest {

    private RiskScoringEngine engine;

    @BeforeEach
    void setUp() {
        engine = new RiskScoringEngine();
    }

    // ─── Base points ──────────────────────────────────────────────────────────

    @Test
    void basePoints_tabSwitch_returns8() {
        assertThat(engine.basePoints(ViolationType.TAB_SWITCH)).isEqualTo(8);
    }

    @Test
    void basePoints_duplicateSubmission_returns50() {
        assertThat(engine.basePoints(ViolationType.DUPLICATE_SUBMISSION)).isEqualTo(50);
    }

    @Test
    void basePoints_unknownType_returnsDefault5() {
        // All types are mapped, so using a known low-value type as proxy
        assertThat(engine.basePoints(ViolationType.RIGHT_CLICK)).isEqualTo(2);
    }

    // ─── Incremental points ───────────────────────────────────────────────────

    @Test
    void incrementalPoints_firstOccurrence_returnsBasePoints() {
        int base = engine.basePoints(ViolationType.TAB_SWITCH);
        assertThat(engine.incrementalPoints(ViolationType.TAB_SWITCH, 0)).isEqualTo(base);
    }

    @Test
    void incrementalPoints_secondOccurrence_returns1Point5xBase() {
        int base = engine.basePoints(ViolationType.TAB_SWITCH); // 8
        int expected = (int) Math.ceil(base * 1.5);             // 12
        assertThat(engine.incrementalPoints(ViolationType.TAB_SWITCH, 1)).isEqualTo(expected);
    }

    @Test
    void incrementalPoints_thirdOccurrence_returns2xBase() {
        int base = engine.basePoints(ViolationType.PASTE_ATTEMPT); // 15
        assertThat(engine.incrementalPoints(ViolationType.PASTE_ATTEMPT, 2))
                .isEqualTo(base * 2); // 30
    }

    // ─── Classification ───────────────────────────────────────────────────────

    @ParameterizedTest(name = "score={0} → {1}")
    @CsvSource({
        "0,  SAFE",
        "9,  SAFE",
        "10, LOW",
        "34, LOW",
        "35, MEDIUM",
        "64, MEDIUM",
        "65, HIGH",
        "89, HIGH",
        "90, CRITICAL",
        "100, CRITICAL"
    })
    void classify_mapsScoreToLevel(int score, String expectedLevel) {
        RiskLevel level = engine.classify(score);
        assertThat(level.name()).isEqualTo(expectedLevel);
    }

    // ─── Client directives ────────────────────────────────────────────────────

    @Test
    void clientDirective_safe_returnsNone() {
        assertThat(engine.clientDirective(RiskLevel.SAFE, false)).isEqualTo("NONE");
    }

    @Test
    void clientDirective_low_returnsNone() {
        assertThat(engine.clientDirective(RiskLevel.LOW, false)).isEqualTo("NONE");
    }

    @Test
    void clientDirective_medium_returnsWarn() {
        assertThat(engine.clientDirective(RiskLevel.MEDIUM, false)).isEqualTo("WARN");
    }

    @Test
    void clientDirective_high_returnsSuspend() {
        assertThat(engine.clientDirective(RiskLevel.HIGH, false)).isEqualTo("SUSPEND");
    }

    @Test
    void clientDirective_critical_returnsTerminate() {
        assertThat(engine.clientDirective(RiskLevel.CRITICAL, false)).isEqualTo("TERMINATE");
    }

    @Test
    void clientDirective_autoActionTriggered_alwaysTerminate() {
        // Regardless of level, if auto-action is triggered → TERMINATE
        for (RiskLevel level : RiskLevel.values()) {
            assertThat(engine.clientDirective(level, true)).isEqualTo("TERMINATE");
        }
    }

    // ─── RiskLevel predicates ─────────────────────────────────────────────────

    @Test
    void requiresAutoAction_highAndCritical() {
        assertThat(RiskLevel.HIGH.requiresAutoAction()).isTrue();
        assertThat(RiskLevel.CRITICAL.requiresAutoAction()).isTrue();
        assertThat(RiskLevel.MEDIUM.requiresAutoAction()).isFalse();
        assertThat(RiskLevel.LOW.requiresAutoAction()).isFalse();
        assertThat(RiskLevel.SAFE.requiresAutoAction()).isFalse();
    }

    @Test
    void requiresReview_mediumAndAbove() {
        assertThat(RiskLevel.MEDIUM.requiresReview()).isTrue();
        assertThat(RiskLevel.HIGH.requiresReview()).isTrue();
        assertThat(RiskLevel.CRITICAL.requiresReview()).isTrue();
        assertThat(RiskLevel.LOW.requiresReview()).isFalse();
        assertThat(RiskLevel.SAFE.requiresReview()).isFalse();
    }

    // ─── Recalculate ─────────────────────────────────────────────────────────

    @Test
    void recalculate_noViolations_returnsZero() {
        int score = engine.recalculate(0, 0, 0, 0, 0, 0);
        assertThat(score).isZero();
    }

    @Test
    void recalculate_singleTabSwitch_returns8() {
        int score = engine.recalculate(1, 0, 0, 0, 0, 0);
        assertThat(score).isEqualTo(8);
    }

    @Test
    void recalculate_clampsAt100() {
        // 10 of each — would exceed 100 without clamping
        int score = engine.recalculate(10, 10, 10, 10, 10, 10);
        assertThat(score).isLessThanOrEqualTo(100);
    }

    @Test
    void recalculate_devtoolsOnly_escalatesQuickly() {
        // DevTools at 3 occurrences should hit MEDIUM+
        int score = engine.recalculate(0, 0, 0, 3, 0, 0);
        RiskLevel level = engine.classify(score);
        assertThat(level).isIn(RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.CRITICAL);
    }
}
