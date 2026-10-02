package com.example.webchicken.modules.catalog.model.dto.response;

public record ProductVariantResponse(
        String id,
        String productId,
        String attribute,
        long basePriceMinor,
        int stockQuantity
) {}
