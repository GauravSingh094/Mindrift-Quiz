package com.mindrift.common.exception;

/**
 * Concrete instantiatable subclass of BaseMindriftException.
 * Used by services that need to throw a general-purpose Mindrift exception.
 */
public class MindriftException extends BaseMindriftException {
    public MindriftException(String message, ErrorCode errorCode) {
        super(message, errorCode);
    }
}
