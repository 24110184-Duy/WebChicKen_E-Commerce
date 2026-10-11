package com.example.webchicken.modules.shop.model.dto.response;

import java.time.LocalDateTime;

/**
 * Thông tin phản hồi một phiếu góp ý / khiếu nại (TASK-69).
 */
public record FeedbackResponse(
        String id,
        String userId,
        String shopName,
        String userEmail,
        String senderName,
        String senderRole,
        String type,
        String subject,
        String content,
        String imageUrl,
        String status,
        String adminResponse,
        String resolvedBy,
        LocalDateTime createdAt,
        LocalDateTime resolvedAt
) {
    public FeedbackResponse(
            String id,
            String userId,
            String shopName,
            String userEmail,
            String type,
            String subject,
            String content,
            String imageUrl,
            String status,
            String adminResponse,
            String resolvedBy,
            LocalDateTime createdAt,
            LocalDateTime resolvedAt
    ) {
        this(id, userId, shopName, userEmail, null, shopName != null ? "SELLER" : "CUSTOMER",
                type, subject, content, imageUrl, status, adminResponse, resolvedBy, createdAt, resolvedAt);
    }
}
