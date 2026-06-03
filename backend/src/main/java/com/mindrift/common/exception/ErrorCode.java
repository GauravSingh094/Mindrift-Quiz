package com.mindrift.common.exception;

public enum ErrorCode {
    INTERNAL_SERVER_ERROR("ERR_SYS_001"),
    INTERNAL_ERROR("ERR_SYS_001"),          // alias for service use
    INVALID_INPUT_PARAMETER("ERR_VAL_002"),
    UNAUTHORIZED_ACCESS("ERR_SEC_003"),
    FORBIDDEN("ERR_SEC_003"),               // alias for forbidden access
    RESOURCE_NOT_FOUND("ERR_DB_004"),
    DATABASE_INTEGRITY_VIOLATION("ERR_DB_005"),
    ANTI_CHEAT_VIOLATION("ERR_SEC_006"),
    TOURNAMENT_LOBBY_LOCKED("ERR_GAME_007"),
    DUPLICATE_SUBMISSION("ERR_GAME_008"),
    INVALID_STATE("ERR_BIZ_009"),
    DUPLICATE_RESOURCE("ERR_BIZ_010"),
    RATE_LIMITED("ERR_SYS_011"),
    OPERATION_TIMEOUT("ERR_SYS_012");

    private final String code;

    ErrorCode(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
