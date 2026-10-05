package com.example.webchicken.modules.order.model.dto.request;

import com.example.webchicken.common.enums.OrderStatus;

/**
 * Request DTO for seller order fulfillment and status transitions (TASK-59).
 */
public record FulfillOrderRequest(
        OrderStatus status,
        String reason,
        String carrier,
        String trackingNumber
) {
}
