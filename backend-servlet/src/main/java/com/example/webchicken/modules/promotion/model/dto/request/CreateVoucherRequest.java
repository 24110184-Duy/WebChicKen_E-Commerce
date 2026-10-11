package com.example.webchicken.modules.promotion.model.dto.request;

import com.example.webchicken.modules.promotion.model.enums.VoucherType;
import java.time.LocalDateTime;

public record CreateVoucherRequest(
        String code,
        String title,
        String description,
        VoucherType type,
        long discountValueMinor,
        long minOrderValueMinor,
        long maxDiscountAmountMinor,
        LocalDateTime startDate,
        LocalDateTime endDate,
        String storeId,
        String categoryId,
        Integer usageLimit
) {
}
