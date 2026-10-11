package com.example.webchicken.modules.catalog.model.dto.response;

import com.example.webchicken.modules.catalog.model.enums.ProductStatus;
import java.time.LocalDateTime;

public record ProductSummaryResponse(
        String id,
        String storeId,
        String categoryId,
        String name,
        ProductStatus status,
        String rejectionReason,
        String moderatedBy,
        String moderationNote,
        String thumbnailUrl,
        long minPriceMinor,
        long maxPriceMinor,
        int totalStock,
        double rating,
        int ratingCount,
        int soldCount,
        LocalDateTime createdAt
) {
    public ProductSummaryResponse(
            String id,
            String storeId,
            String categoryId,
            String name,
            ProductStatus status,
            String rejectionReason,
            String thumbnailUrl,
            long minPriceMinor,
            long maxPriceMinor,
            int totalStock,
            LocalDateTime createdAt
    ) {
        this(id, storeId, categoryId, name, status, rejectionReason, null, null, thumbnailUrl,
                minPriceMinor, maxPriceMinor, totalStock, 0.0, 0, 0, createdAt);
    }

    public ProductSummaryResponse(
            String id,
            String storeId,
            String categoryId,
            String name,
            ProductStatus status,
            String rejectionReason,
            String thumbnailUrl,
            long minPriceMinor,
            long maxPriceMinor,
            int totalStock,
            double rating,
            int ratingCount,
            int soldCount,
            LocalDateTime createdAt
    ) {
        this(id, storeId, categoryId, name, status, rejectionReason, null, null, thumbnailUrl,
                minPriceMinor, maxPriceMinor, totalStock, rating, ratingCount, soldCount, createdAt);
    }
}
