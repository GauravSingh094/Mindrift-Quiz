package com.mindrift.common.storage;

public class StoragePathUtils {
    public static final String CERTIFICATES = "certificates/";
    public static final String REPORTS = "reports/";
    public static final String EXPORTS = "exports/";
    public static final String QUIZ_ASSETS = "quiz-assets/";
    public static final String AVATARS = "avatars/";
    public static final String COMPETITION_ASSETS = "competition-assets/";
    public static final String AI_GENERATED = "ai-generated/";

    public static String getCertificatePath(String filename) {
        return CERTIFICATES + filename;
    }

    public static String getReportPath(String filename) {
        return REPORTS + filename;
    }

    public static String getExportPath(String filename) {
        return EXPORTS + filename;
    }

    public static String getQuizAssetPath(String filename) {
        return QUIZ_ASSETS + filename;
    }

    public static String getAvatarPath(String filename) {
        return AVATARS + filename;
    }

    public static String getCompetitionAssetPath(String filename) {
        return COMPETITION_ASSETS + filename;
    }

    public static String getAiGeneratedPath(String filename) {
        return AI_GENERATED + filename;
    }
}
