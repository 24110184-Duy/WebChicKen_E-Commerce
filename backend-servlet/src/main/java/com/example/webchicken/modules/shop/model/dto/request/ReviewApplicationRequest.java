package com.example.webchicken.modules.shop.model.dto.request;

/**
 * Request phê duyệt hoặc từ chối đơn đăng ký làm Người bán.
 */
public record ReviewApplicationRequest(
        String status,          // APPROVED | REJECTED
        String rejectionReason  // Bắt buộc nếu status = REJECTED
) {}
