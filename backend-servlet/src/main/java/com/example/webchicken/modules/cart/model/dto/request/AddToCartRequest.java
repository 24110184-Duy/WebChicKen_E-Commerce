package com.example.webchicken.modules.cart.model.dto.request;

public record AddToCartRequest(
        String productId,
        String variantId,
        int quantity
) {
    public AddToCartRequest {
        if (quantity <= 0) quantity = 1;
    }
}
