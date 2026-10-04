package com.example.webchicken.modules.cart.model.dto.response;

import java.util.List;

public record CartResponse(
        String cartId,
        String customerId,
        List<CartStoreGroupResponse> storeGroups,
        int totalQuantity,
        long totalAmountMinor,
        boolean hasOutOfStockItems,
        boolean hasPriceChanges
) {}
