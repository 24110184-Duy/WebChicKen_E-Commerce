package com.example.webchicken.modules.shop.model.dto.response;

import java.time.LocalDateTime;

/**
 * Thông tin phản hồi đơn đăng ký Người bán.
 */
public record SellerApplicationResponse(
        String id,
        String userId,
        String shopName,
        String documentUrl,
        String status,
        String rejectionReason,
        String adminResponseId,
        LocalDateTime submittedAt,
        LocalDateTime reviewedAt,
        String ownerName,
        String phone,
        String email,
        String farmLocation,
        String farmType,
        String taxCode,
        String certificateType,
        String certificateNumber,
        String certificateExpiry,
        String dailyCapacity
) {
    public SellerApplicationResponse(
            String id,
            String userId,
            String shopName,
            String documentUrl,
            String status,
            String rejectionReason,
            String adminResponseId,
            LocalDateTime submittedAt,
            LocalDateTime reviewedAt
    ) {
        this(
                id,
                userId,
                shopName,
                documentUrl,
                status,
                rejectionReason,
                adminResponseId,
                submittedAt,
                reviewedAt,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );
    }
}
