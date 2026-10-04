package com.example.webchicken.modules.order.model.dto.request;

import com.example.webchicken.modules.order.model.enums.PaymentMethod;
import java.util.List;

public record CheckoutRequest(
        List<CheckoutItemRequest> items,
        String recipientName,
        String recipientPhone,
        String shippingAddress,
        String voucherCode,
        PaymentMethod paymentMethod,
        String note
) {
}
