package com.example.webchicken.modules.payment.model.dto.response;

public record PaymentMethodResponse(
        String code,
        String name,
        String description,
        boolean isDefault
) {}
