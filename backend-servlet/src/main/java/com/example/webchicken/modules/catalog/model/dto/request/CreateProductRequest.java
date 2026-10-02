package com.example.webchicken.modules.catalog.model.dto.request;

import java.util.List;

public record CreateProductRequest(
        String storeId,
        String categoryId,
        String name,
        String description,
        List<String> imageUrls,
        List<CreateVariantRequest> variants
) {
    public CreateProductRequest {
        if (storeId == null || storeId.trim().isEmpty()) {
            throw new IllegalArgumentException("storeId must not be empty");
        }
        if (categoryId == null || categoryId.trim().isEmpty()) {
            throw new IllegalArgumentException("categoryId must not be empty");
        }
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Product name must not be empty");
        }
        name = name.trim();
        storeId = storeId.trim();
        categoryId = categoryId.trim();
        if (imageUrls == null) {
            imageUrls = List.of();
        }
        if (variants == null || variants.isEmpty()) {
            throw new IllegalArgumentException("Product must have at least one variant");
        }
    }
}
