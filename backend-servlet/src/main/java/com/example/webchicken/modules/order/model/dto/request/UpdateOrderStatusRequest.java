package com.example.webchicken.modules.order.model.dto.request;

import com.example.webchicken.common.enums.OrderStatus;
import com.example.webchicken.modules.order.model.enums.OrderActorType;

public record UpdateOrderStatusRequest(
        OrderStatus status,
        OrderActorType actorType,
        String reason
) {
}
