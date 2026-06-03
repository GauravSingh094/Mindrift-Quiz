package com.mindrift.integrity.entity;

/**
 * Five-tier risk classification.
 *
 * SAFE     → no violations detected; attempt proceeds normally
 * LOW      → minor anomalies (single tab switch, one right-click); flag for review
 * MEDIUM   → multiple suspicious signals; proctor notified; score flagged
 * HIGH     → strong evidence of cheating; attempt suspended; admin review required
 * CRITICAL → definitive integrity breach; auto-disqualification triggered
 */
public enum RiskLevel {
    SAFE,
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL;

    /** Returns true if the level warrants an automatic action (suspend / disqualify). */
    public boolean requiresAutoAction() {
        return this == HIGH || this == CRITICAL;
    }

    /** Returns true if the level requires a human moderator review. */
    public boolean requiresReview() {
        return this == MEDIUM || this == HIGH || this == CRITICAL;
    }
}
