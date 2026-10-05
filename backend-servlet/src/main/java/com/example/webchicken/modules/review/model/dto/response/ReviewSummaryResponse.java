package com.example.webchicken.modules.review.model.dto.response;

public record ReviewSummaryResponse(
        String productId,
        double averageRating,
        long totalReviews,
        long fiveStarCount,
        long fourStarCount,
        long threeStarCount,
        long twoStarCount,
        long oneStarCount
) {}
