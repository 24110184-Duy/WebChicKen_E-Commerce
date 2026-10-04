package com.example.webchicken.modules.order.model.dto.response;

import com.example.webchicken.common.enums.OrderStatus;
import com.example.webchicken.common.enums.PaymentStatus;
import com.example.webchicken.modules.order.model.entity.OrderEntity;
import com.example.webchicken.modules.order.model.enums.PaymentMethod;

import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(
        String id,
        String orderCode,
        String orderGroupId,
        String customerId,
        String storeId,
        String storeName,
        LocalDateTime orderDate,
        OrderStatus status,
        PaymentStatus paymentStatus,
        PaymentMethod paymentMethod,
        long totalAmountMinor,
        long shippingFeeMinor,
        long discountAmountMinor,
        String recipientName,
        String recipientPhone,
        String shippingAddress,
        String note,
        List<OrderItemResponse> items
) {
    public static OrderResponse fromEntity(OrderEntity entity, String storeName, List<OrderItemResponse> items) {
        if (entity == null) return null;
        return new OrderResponse(
                entity.getId(),
                entity.getOrderCode(),
                entity.getOrderGroupId(),
                entity.getCustomerId(),
                entity.getStoreId(),
                storeName,
                entity.getOrderDate(),
                entity.getStatus(),
                entity.getPaymentStatus(),
                entity.getPaymentMethod(),
                entity.getTotalAmountMinor(),
                entity.getShippingFeeMinor(),
                entity.getDiscountAmountMinor(),
                entity.getRecipientName(),
                entity.getRecipientPhone(),
                entity.getShippingAddress(),
                entity.getNote(),
                items != null ? items : List.of()
        );
    }
}
