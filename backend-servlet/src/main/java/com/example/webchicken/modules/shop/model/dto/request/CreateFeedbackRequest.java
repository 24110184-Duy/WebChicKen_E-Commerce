package com.example.webchicken.modules.shop.model.dto.request;

/**
 * Yêu cầu gửi phản hồi / khiếu nại từ Nhà bán (TASK-69).
 */
public record CreateFeedbackRequest(
        String type,      // COMPLAINT, INQUIRY, SUGGESTION, TECHNICAL, PAYMENT
        String subject,   // Tiêu đề
        String content,   // Nội dung chi tiết
        String imageUrl   // Đường dẫn ảnh đính kèm minh chứng (nếu có)
) {}
