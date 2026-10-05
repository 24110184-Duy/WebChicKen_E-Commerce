package com.example.webchicken.modules.payment.model.dto.response;

public record PaymentUrlResponse(
        String orderCode,
        long amountMinor,
        String paymentUrl
) {}
