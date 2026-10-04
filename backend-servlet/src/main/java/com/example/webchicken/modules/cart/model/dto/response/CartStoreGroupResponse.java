package com.example.webchicken.modules.cart.model.dto.response;

import java.util.List;

public record CartStoreGroupResponse(
        String storeId,
        String storeName,
        List<CartItemResponse> items,
        long storeSubtotalMinor
) {}
