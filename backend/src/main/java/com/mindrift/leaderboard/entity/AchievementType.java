package com.mindrift.leaderboard.entity;

/**
 * Canonical set of achievement keys.
 * Each maps to a display name and badge icon in the front-end.
 */
public enum AchievementType {

    // ─── Milestones ─────────────────────────────────────────────────────────
    FIRST_QUIZ("First Steps",      "Complete your very first quiz"),
    FIRST_WIN("Winner!",           "Rank #1 on any competition leaderboard"),
    QUIZZES_10("Quiz Dabbler",     "Complete 10 quizzes"),
    QUIZZES_50("Quiz Enthusiast",  "Complete 50 quizzes"),
    QUIZZES_100("Century Scholar", "Complete 100 quizzes"),
    QUIZZES_500("Quiz Legend",     "Complete 500 quizzes"),

    // ─── Accuracy ────────────────────────────────────────────────────────────
    PERFECT_SCORE("Perfectionist",   "Score 100% on any quiz"),
    PERFECT_SCORE_5("Sharp Mind",    "Score 100% on 5 quizzes"),
    PERFECT_SCORE_25("Flawless",     "Score 100% on 25 quizzes"),

    // ─── Leaderboard Positions ───────────────────────────────────────────────
    TOP_10_GLOBAL("Elite Player",   "Reach the global top 10"),
    TOP_3_GLOBAL("Podium Finisher", "Reach the global top 3"),
    RANK_1_GLOBAL("Grand Champion", "Reach global rank #1"),

    // ─── Streak ──────────────────────────────────────────────────────────────
    STREAK_7("Week Warrior",   "7-day quiz streak"),
    STREAK_30("Month Master",  "30-day quiz streak"),

    // ─── Social ──────────────────────────────────────────────────────────────
    COMPETITION_WINNER("Champion",     "Win a competition"),
    SEASON_WINNER("Season Conqueror",  "Finish #1 in a seasonal leaderboard");

    public final String displayName;
    public final String description;

    AchievementType(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }
}
