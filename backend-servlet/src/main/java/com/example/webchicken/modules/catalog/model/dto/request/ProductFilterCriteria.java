package com.example.webchicken.modules.catalog.model.dto.request;

import com.example.webchicken.modules.catalog.model.enums.ProductStatus;

public record ProductFilterCriteria(
        String query,
        String categoryId,
        String storeId,
        Long minPriceMinor,
        Long maxPriceMinor,
        ProductStatus status,
        String sort, // "newest", "price_asc", "price_desc"
        int page,
        int size
) {
    public ProductFilterCriteria {
        if (query != null) query = query.trim();
        if (categoryId != null) categoryId = categoryId.trim();
        if (storeId != null) storeId = storeId.trim();
        if (sort != null) sort = sort.trim().toLowerCase();
        if (page < 0) page = 0;
        if (size <= 0) size = 20;
        if (size > 100) size = 100;
    }

    public int offset() {
        return page * size;
    }
}
