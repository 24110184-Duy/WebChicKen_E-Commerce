package com.example.webchicken.modules.order.model.dto.response;

import com.example.webchicken.modules.order.model.entity.OrderItemEntity;
import com.fasterxml.jackson.annotation.JsonProperty;

public record OrderItemResponse(
        String id,
        String productId,
        String variantId,
        String productName,
        String variantName,
        String imageUrl,
        int quantity,
        long unitPriceMinor,
        long subtotalMinor
) {
    @JsonProperty("unitPriceAtPurchaseMinor")
    public long unitPriceAtPurchaseMinor() {
        return unitPriceMinor;
    }
    public static OrderItemResponse fromEntity(OrderItemEntity entity) {
        if (entity == null) return null;
        long subtotal = entity.getUnitPriceAtPurchaseMinor() * entity.getQuantity();
        return new OrderItemResponse(
                entity.getId(),
                entity.getProductId(),
                entity.getVariantId(),
                entity.getProductName(),
                entity.getVariantName(),
                entity.getImageUrl(),
                entity.getQuantity(),
                entity.getUnitPriceAtPurchaseMinor(),
                subtotal
        );
    }
}
