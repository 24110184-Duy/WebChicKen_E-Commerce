package com.example.webchicken.modules.cart.model.dto.response;

public record CartItemResponse(
        String itemId,
        String productId,
        String variantId,
        String productName,
        String variantAttribute,
        String thumbnailUrl,
        long currentPriceMinor,
        int quantity,
        int availableStock,
        long itemTotalMinor,
        boolean isAvailable,
        boolean priceChanged,
        String storeId,
        String storeName
) {}
