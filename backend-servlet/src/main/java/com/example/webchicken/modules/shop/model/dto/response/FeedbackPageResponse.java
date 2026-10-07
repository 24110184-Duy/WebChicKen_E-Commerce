package com.example.webchicken.modules.shop.model.dto.response;

import java.util.List;

/**
 * Kết quả phân trang danh sách phản hồi / khiếu nại (TASK-69).
 */
public record FeedbackPageResponse(
        List<FeedbackResponse> items,
        long total,
        int page,
        int size,
        int totalPages
) {}
