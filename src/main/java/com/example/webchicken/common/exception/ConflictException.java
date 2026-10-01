package com.example.webchicken.common.exception;
public class ConflictException extends AppException {
    public ConflictException(String errorCode, String message) {
        super(errorCode, 409, message);
    }
}
