package com.example.webchicken.common.exception;

/** Base exception. Mọi exception tùy biến trong dự án kế thừa lớp này. */
public abstract class AppException extends RuntimeException {
    private final String errorCode;
    private final int httpStatus;

    protected AppException(String errorCode, int httpStatus, String message) {
        super(message);
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
    }

    public String getErrorCode() { return errorCode; }
    public int getHttpStatus()   { return httpStatus; }
}
