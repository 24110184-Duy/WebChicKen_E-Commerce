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
        LocalDateTime reviewedAt
) {}
