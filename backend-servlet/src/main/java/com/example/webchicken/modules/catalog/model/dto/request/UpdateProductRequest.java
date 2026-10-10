package com.example.webchicken.modules.catalog.model.dto.request;

import com.example.webchicken.modules.catalog.model.enums.ProductStatus;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record UpdateProductRequest(
        String categoryId,
        String name,
        String description,
        ProductStatus status,
        List<String> imageUrls,
        List<CreateVariantRequest> variants
) {
    public UpdateProductRequest {
        if (categoryId != null) categoryId = categoryId.trim();
        if (name != null) name = name.trim();
        if (description != null) description = description.trim();
    }

    public UpdateProductRequest(String categoryId, String name, String description, ProductStatus status) {
        this(categoryId, name, description, status, null, null);
    }
}
