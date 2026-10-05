package com.example.webchicken.modules.payment.model.dto.response;

import com.example.webchicken.common.enums.PaymentStatus;
import com.example.webchicken.modules.payment.model.entity.PaymentEntity;
import java.time.LocalDateTime;

public record PaymentResponse(
        String id,
        String orderId,
        long amountMinor,
        PaymentStatus status,
        String transactionRef,
        LocalDateTime paidAt
) {
    public static PaymentResponse fromEntity(PaymentEntity entity) {
        if (entity == null) return null;
        return new PaymentResponse(
                entity.getId(),
                entity.getOrderId(),
                entity.getAmountMinor(),
                entity.getStatus(),
                entity.getTransactionRef(),
                entity.getPaidAt()
        );
    }
}
