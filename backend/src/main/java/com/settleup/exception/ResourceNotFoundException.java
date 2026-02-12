package com.settleup.exception;

/**
 * 리소스를 찾을 수 없는 경우 발생하는 예외
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s를 찾을 수 없습니다 (%s: %s)", resourceName, fieldName, fieldValue));
    }
}
