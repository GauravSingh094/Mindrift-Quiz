package com.mindrift.common.exception;

public abstract class BaseMindriftException extends RuntimeException {
    private final ErrorCode errorCode;

    protected BaseMindriftException(String message, ErrorCode errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }
}
