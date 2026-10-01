package com.example.webchicken.common.exception;
public class DataAccessException extends AppException {
    public DataAccessException(String message, Throwable cause) {
        super("DB_ERROR", 500, message);
        initCause(cause);
    }
}
