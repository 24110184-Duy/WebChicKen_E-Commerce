package com.example.webchicken.common.exception;
public class NotFoundException extends AppException {
    public NotFoundException(String message) {
        super("NOT_FOUND", 404, message);
    }

    public NotFoundException(String errorCode, String message) {
        super(errorCode, 404, message);
    }
}
