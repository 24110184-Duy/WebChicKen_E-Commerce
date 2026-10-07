package com.example.webchicken.modules.shop.model.dto.request;

/**
 * Yêu cầu giải quyết hoặc phản hồi phiếu hỗ trợ từ Quản trị viên (TASK-69).
 */
public record RespondFeedbackRequest(
        String status,        // RESOLVED, PROCESSING, REJECTED
        String adminResponse  // Nội dung trả lời, hướng dẫn xử lý từ BQT
) {}
