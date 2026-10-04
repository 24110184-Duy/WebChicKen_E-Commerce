package com.example.webchicken.modules.promotion.model.dto.request;

public record ValidateVoucherRequest(
        String code,
        long orderValueMinor,
        String storeId
) {
}
