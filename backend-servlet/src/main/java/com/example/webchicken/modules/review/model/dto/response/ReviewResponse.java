package com.example.webchicken.modules.review.model.dto.response;

import com.example.webchicken.modules.review.model.enums.ReviewStatus;

import java.time.LocalDateTime;
import java.util.List;

public record ReviewResponse(
        String id,
        String userId,
        String userName,
        String userAvatar,
        String orderId,
        String orderItemId,
        String productId,
        int rating,
        String comment,
        List<String> mediaUrls,
        String sellerReply,
        LocalDateTime sellerReplyAt,
        ReviewStatus status,
        int helpfulCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
