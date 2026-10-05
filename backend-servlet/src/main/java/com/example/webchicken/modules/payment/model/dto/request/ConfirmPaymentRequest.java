package com.example.webchicken.modules.payment.model.dto.request;

public record ConfirmPaymentRequest(
        String orderId,
        String note
) {}
