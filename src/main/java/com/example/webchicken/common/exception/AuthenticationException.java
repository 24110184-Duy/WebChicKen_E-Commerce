package com.example.webchicken.common.exception;
public class AuthenticationException extends AppException {
    public AuthenticationException(String errorCode, String message) {
        super(errorCode, 401, message);
    }
}
