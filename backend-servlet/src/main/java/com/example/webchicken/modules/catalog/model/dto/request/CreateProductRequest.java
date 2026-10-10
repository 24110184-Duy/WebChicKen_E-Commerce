package com.example.webchicken.modules.catalog.model.dto.request;

import com.example.webchicken.modules.catalog.model.enums.ProductStatus;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record CreateProductRequest(
        String storeId,
        String categoryId,
        String name,
        String description,
        List<String> imageUrls,
        List<CreateVariantRequest> variants,
        ProductStatus status
) {
    public CreateProductRequest(
            String storeId,
            String categoryId,
            String name,
            String description,
            List<String> imageUrls,
            List<CreateVariantRequest> variants
    ) {
        this(storeId, categoryId, name, description, imageUrls, variants, ProductStatus.PENDING_APPROVAL);
    }

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
        if (status == null) {
            status = ProductStatus.PENDING_APPROVAL;
        }
    }
}
