package com.example.webchicken.common.exception;
public class AuthorizationException extends AppException {
    public AuthorizationException(String errorCode, String message) {
        super(errorCode, 403, message);
    }
}
