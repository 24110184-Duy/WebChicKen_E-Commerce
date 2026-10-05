package com.example.webchicken.modules.review.model.dto.request;

import java.util.List;

public record UpdateReviewRequest(
        int rating,
        String comment,
        List<String> mediaUrls
) {}
