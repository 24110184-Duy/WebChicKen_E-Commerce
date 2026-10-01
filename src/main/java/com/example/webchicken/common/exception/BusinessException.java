package com.example.webchicken.common.exception;
/** Vi phạm rule nghiệp vụ (state machine, hàng tồn kho...) */
public class BusinessException extends AppException {
    public BusinessException(String errorCode, String message) {
        super(errorCode, 422, message);
    }
}
