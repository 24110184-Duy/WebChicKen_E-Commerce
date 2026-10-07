package com.example.webchicken.modules.catalog.model.dto.response;

import com.example.webchicken.modules.catalog.model.enums.ProductStatus;
import java.time.LocalDateTime;
import java.util.List;

public record ProductDetailResponse(
        String id,
        String storeId,
        String categoryId,
        String categoryName,
        String name,
        String description,
        ProductStatus status,
        String rejectionReason,
        List<String> imageUrls,
        List<ProductVariantResponse> variants,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
