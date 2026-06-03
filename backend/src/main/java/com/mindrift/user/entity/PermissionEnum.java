package com.mindrift.user.entity;

public enum PermissionEnum {
    QUIZ_CREATE("quiz:create"),
    QUIZ_UPDATE("quiz:update"),
    QUIZ_DELETE("quiz:delete"),
    QUIZ_PUBLISH("quiz:publish"),
    COMPETITION_CREATE("competition:create"),
    COMPETITION_START("competition:start"),
    COMPETITION_END("competition:end"),
    LEADERBOARD_VIEW("leaderboard:view"),
    ANALYTICS_VIEW("analytics:view"),
    ANALYTICS_EXPORT("analytics:export"),
    USER_MANAGE("user:manage"),
    ADMIN_MANAGE("admin:manage"),
    NOTIFICATION_SEND("notification:send"),
    AUDIT_VIEW("audit:view");

    private final String value;

    PermissionEnum(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static PermissionEnum fromValue(String value) {
        for (PermissionEnum p : PermissionEnum.values()) {
            if (p.getValue().equals(value)) {
                return p;
            }
        }
        throw new IllegalArgumentException("Unknown permission value: " + value);
    }
}
