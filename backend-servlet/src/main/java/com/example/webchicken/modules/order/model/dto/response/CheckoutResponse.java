package com.example.webchicken.modules.order.model.dto.response;

import java.util.List;

public record CheckoutResponse(
        String orderGroupId,
        long totalAmountMinor,
        long totalShippingFeeMinor,
        long totalDiscountMinor,
        long grandTotalMinor,
        List<OrderResponse> orders
) {
}
