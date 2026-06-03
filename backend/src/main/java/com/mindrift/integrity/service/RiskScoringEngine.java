package com.mindrift.integrity.service;

import com.mindrift.integrity.entity.RiskLevel;
import com.mindrift.integrity.entity.ViolationType;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Stateless risk scoring engine.
 *
 * Maps ViolationTypes to base point values and computes an aggregate risk score.
 * Score is clamped to [0, 100].
 *
 * Score → Level mapping:
 *   < 10  → SAFE
 *   10–34 → LOW
 *   35–64 → MEDIUM
 *   65–89 → HIGH
 *   ≥ 90  → CRITICAL
 *
 * Points are also modified by frequency:
 *   - First occurrence: base points
 *   - 2nd occurrence:   base × 1.5
 *   - 3rd+ occurrence:  base × 2.0  (diminishing marginal additions)
 */
@Component
public class RiskScoringEngine {

    /** Base point values per violation type (out of 100). */
    private static final Map<ViolationType, Integer> BASE_POINTS = Map.ofEntries(
        // Client-side / low severity
        Map.entry(ViolationType.RIGHT_CLICK,          2),
        Map.entry(ViolationType.WINDOW_BLUR,          3),
        Map.entry(ViolationType.TAB_SWITCH,           8),
        Map.entry(ViolationType.FULLSCREEN_EXIT,      10),
        Map.entry(ViolationType.COPY_ATTEMPT,         12),
        Map.entry(ViolationType.CUT_ATTEMPT,          10),
        Map.entry(ViolationType.PASTE_ATTEMPT,        15),

        // DevTools
        Map.entry(ViolationType.DEVTOOLS_OPEN,        20),
        Map.entry(ViolationType.CONSOLE_ACCESS,       18),
        Map.entry(ViolationType.DEBUGGER_DETECTED,    25),

        // Suspicious patterns
        Map.entry(ViolationType.RAPID_ANSWER_CHANGE,  15),
        Map.entry(ViolationType.ANSWER_FLOOD,         25),
        Map.entry(ViolationType.IMPOSSIBLE_TIMING,    35),

        // Server-side / high severity
        Map.entry(ViolationType.IP_MISMATCH,          30),
        Map.entry(ViolationType.USER_AGENT_MISMATCH,  20),
        Map.entry(ViolationType.MULTIPLE_SESSIONS,    40),
        Map.entry(ViolationType.DUPLICATE_SUBMISSION, 50),

        // Proctoring
        Map.entry(ViolationType.CAMERA_BLOCKED,       25),
        Map.entry(ViolationType.FACE_NOT_DETECTED,    15),
        Map.entry(ViolationType.MULTIPLE_FACES,       45),
        Map.entry(ViolationType.AUDIO_ANOMALY,        10)
    );

    /**
     * Returns the base point value for a violation type.
     */
    public int basePoints(ViolationType type) {
        return BASE_POINTS.getOrDefault(type, 5);
    }

    /**
     * Computes the incremental score increase considering frequency multiplier.
     *
     * @param type          the violation type
     * @param previousCount how many times this type has already occurred
     * @return points to add to the existing aggregate score
     */
    public int incrementalPoints(ViolationType type, long previousCount) {
        int base = basePoints(type);
        if (previousCount == 0) return base;
        if (previousCount == 1) return (int) Math.ceil(base * 1.5);
        return base * 2;
    }

    /**
     * Recalculates the total risk score from the current violation counters.
     * Used after bulk updates (e.g. report generation).
     *
     * @param tabSwitches    number of TAB_SWITCH events
     * @param copyPastes     number of COPY/PASTE/CUT events
     * @param fullscreenExits number of FULLSCREEN_EXIT events
     * @param devtools       number of DEVTOOLS_* events
     * @param rapidChanges   number of RAPID_ANSWER_CHANGE events
     * @param serverSide     number of server-side events (IP_MISMATCH etc.)
     */
    public int recalculate(int tabSwitches, int copyPastes, int fullscreenExits,
                           int devtools, int rapidChanges, int serverSide) {
        int score = 0;
        score += accumulatedPoints(ViolationType.TAB_SWITCH,       tabSwitches);
        score += accumulatedPoints(ViolationType.COPY_ATTEMPT,     copyPastes);
        score += accumulatedPoints(ViolationType.FULLSCREEN_EXIT,  fullscreenExits);
        score += accumulatedPoints(ViolationType.DEVTOOLS_OPEN,    devtools);
        score += accumulatedPoints(ViolationType.RAPID_ANSWER_CHANGE, rapidChanges);
        score += accumulatedPoints(ViolationType.MULTIPLE_SESSIONS, serverSide);
        return Math.min(score, 100);
    }

    /**
     * Determines the RiskLevel from a numeric score.
     */
    public RiskLevel classify(int score) {
        if (score >= 90) return RiskLevel.CRITICAL;
        if (score >= 65) return RiskLevel.HIGH;
        if (score >= 35) return RiskLevel.MEDIUM;
        if (score >= 10) return RiskLevel.LOW;
        return RiskLevel.SAFE;
    }

    /**
     * Computes the directive that should be sent back to the client.
     *
     * NONE      → no action required client-side
     * WARN      → show a warning modal; attempt continues
     * SUSPEND   → lock the attempt UI; pending moderator review
     * TERMINATE → end the session immediately
     */
    public String clientDirective(RiskLevel level, boolean autoAction) {
        if (autoAction) return "TERMINATE";
        return switch (level) {
            case CRITICAL -> "TERMINATE";
            case HIGH     -> "SUSPEND";
            case MEDIUM   -> "WARN";
            default       -> "NONE";
        };
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    private int accumulatedPoints(ViolationType type, int count) {
        if (count <= 0) return 0;
        int base   = basePoints(type);
        int points = base; // first
        if (count >= 2) points += (int) Math.ceil(base * 1.5);
        if (count >= 3) points += base * 2 * (count - 2); // every extra at 2x
        return points;
    }
}
