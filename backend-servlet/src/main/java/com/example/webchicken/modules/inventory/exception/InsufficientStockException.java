package com.example.webchicken.modules.inventory.exception;

import com.example.webchicken.common.exception.AppException;

/**
 * Ngoại lệ ném ra khi số lượng tồn kho khả dụng không đủ để đáp ứng yêu cầu đặt hàng/giữ kho.
 * Mã lỗi nghiệp vụ: INV_0001 - HTTP 409 Conflict.
 */
public class InsufficientStockException extends AppException {

    public InsufficientStockException(String skuId, int requested, int available) {
        super("INV_0001", 409, String.format("Insufficient stock for SKU [%s]: requested %d, but only %d available.", skuId, requested, available));
    }

    public InsufficientStockException(String message) {
        super("INV_0001", 409, message);
    }
}
