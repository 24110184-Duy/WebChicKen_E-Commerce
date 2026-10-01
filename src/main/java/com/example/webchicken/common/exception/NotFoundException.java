package com.example.webchicken.common.exception;
public class NotFoundException extends AppException {
    public NotFoundException(String errorCode, String message) {
        super(errorCode, 404, message);
    }
}
