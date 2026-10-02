package com.example.webchicken.modules.catalog.model.dto.request;

import com.example.webchicken.modules.catalog.model.enums.ProductStatus;

public record UpdateProductRequest(
        String categoryId,
        String name,
        String description,
        ProductStatus status
) {
    public UpdateProductRequest {
        if (categoryId != null) categoryId = categoryId.trim();
        if (name != null) name = name.trim();
        if (description != null) description = description.trim();
    }
}
