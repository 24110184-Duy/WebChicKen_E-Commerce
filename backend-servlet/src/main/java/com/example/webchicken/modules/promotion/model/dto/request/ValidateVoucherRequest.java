package com.example.webchicken.modules.promotion.model.dto.request;

public record ValidateVoucherRequest(
        String code,
        long orderValueMinor,
        String storeId,
        String categoryId
) {
    public ValidateVoucherRequest(String code, long orderValueMinor, String storeId) {
        this(code, orderValueMinor, storeId, null);
    }
}
