package com.example.webchicken.modules.catalog.model.dto.response;

import com.example.webchicken.modules.catalog.model.enums.ProductStatus;
import java.time.LocalDateTime;

public record ProductSummaryResponse(
        String id,
        String storeId,
        String categoryId,
        String name,
        ProductStatus status,
        String thumbnailUrl,
        long minPriceMinor,
        long maxPriceMinor,
        int totalStock,
        LocalDateTime createdAt
) {}
