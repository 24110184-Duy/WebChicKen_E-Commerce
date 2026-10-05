package com.example.webchicken.modules.review.model.dto.request;

import java.util.List;

public record CreateReviewRequest(
        String orderId,
        String orderItemId,
        String productId,
        int rating,
        String comment,
        List<String> mediaUrls
) {}
