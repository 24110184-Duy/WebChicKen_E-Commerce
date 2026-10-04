package com.example.webchicken.modules.promotion.model.dto.response;

import com.example.webchicken.modules.promotion.model.entity.VoucherEntity;
import com.example.webchicken.modules.promotion.model.enums.VoucherType;
import java.time.LocalDateTime;

public record VoucherResponse(
        String id,
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
        int usageLimit,
        int usedCount,
        boolean isActive
) {
    public static VoucherResponse fromEntity(VoucherEntity entity) {
        if (entity == null) return null;
        return new VoucherResponse(
                entity.getId(),
                entity.getCode(),
                entity.getTitle(),
                entity.getDescription(),
                entity.getType(),
                entity.getDiscountValueMinor(),
                entity.getMinOrderValueMinor(),
                entity.getMaxDiscountAmountMinor(),
                entity.getStartDate(),
                entity.getEndDate(),
                entity.getStoreId(),
                entity.getUsageLimit(),
                entity.getUsedCount(),
                entity.isActive()
        );
    }
}
