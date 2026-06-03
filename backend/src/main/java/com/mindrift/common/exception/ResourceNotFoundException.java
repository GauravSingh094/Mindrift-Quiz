package com.mindrift.common.exception;

public class ResourceNotFoundException extends BaseMindriftException {
    public ResourceNotFoundException(String message) {
        super(message, ErrorCode.RESOURCE_NOT_FOUND);
    }
}
