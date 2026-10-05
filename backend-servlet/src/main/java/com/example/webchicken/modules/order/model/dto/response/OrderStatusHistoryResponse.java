package com.example.webchicken.modules.order.model.dto.response;

import com.example.webchicken.common.enums.OrderStatus;
import com.example.webchicken.modules.order.model.entity.OrderStatusHistoryEntity;
import com.example.webchicken.modules.order.model.enums.OrderActorType;

import java.time.LocalDateTime;

public record OrderStatusHistoryResponse(
        String id,
        String orderId,
        OrderStatus fromStatus,
        OrderStatus toStatus,
        OrderActorType actorType,
        String actorId,
        String reason,
        LocalDateTime createdAt
) {
    public static OrderStatusHistoryResponse fromEntity(OrderStatusHistoryEntity entity) {
        if (entity == null) return null;
        return new OrderStatusHistoryResponse(
                entity.getId(),
                entity.getOrderId(),
                entity.getFromStatus(),
                entity.getToStatus(),
                entity.getActorType(),
                entity.getActorId(),
                entity.getReason(),
                entity.getCreatedAt()
        );
    }
}
