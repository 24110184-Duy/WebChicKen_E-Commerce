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
        String moderatedBy,
        String moderationNote,
        List<String> imageUrls,
        List<ProductVariantResponse> variants,
        double rating,
        int ratingCount,
        int soldCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public ProductDetailResponse(
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
    ) {
        this(id, storeId, categoryId, categoryName, name, description, status, rejectionReason,
                null, null, imageUrls, variants, 0.0, 0, 0, createdAt, updatedAt);
    }

    public ProductDetailResponse(
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
            double rating,
            int ratingCount,
            int soldCount,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        this(id, storeId, categoryId, categoryName, name, description, status, rejectionReason,
                null, null, imageUrls, variants, rating, ratingCount, soldCount, createdAt, updatedAt);
    }
}
