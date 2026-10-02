package com.example.webchicken.modules.catalog.model.dto.request;

public record CreateVariantRequest(
        String attribute,
        long basePriceMinor,
        int stockQuantity
) {
    public CreateVariantRequest {
        if (attribute == null || attribute.trim().isEmpty()) {
            throw new IllegalArgumentException("Variant attribute must not be empty");
        }
        attribute = attribute.trim();
        if (basePriceMinor < 0) {
            throw new IllegalArgumentException("Variant base price must not be negative");
        }
        if (stockQuantity < 0) {
            throw new IllegalArgumentException("Variant stock quantity must not be negative");
        }
    }
}
