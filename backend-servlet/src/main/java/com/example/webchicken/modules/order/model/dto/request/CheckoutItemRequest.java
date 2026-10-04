package com.example.webchicken.modules.order.model.dto.request;

public record CheckoutItemRequest(
        String productId,
        String variantId,
        int quantity
) {
}
