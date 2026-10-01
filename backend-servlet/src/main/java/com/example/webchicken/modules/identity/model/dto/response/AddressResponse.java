package com.example.webchicken.modules.identity.model.dto.response;

import java.time.LocalDateTime;

/** Thông tin địa chỉ nhận hàng */
public record AddressResponse(
        String addressId,
        String userId,
        String recipientName,
        String phone,
        String addressLine1,
        String district,
        String city,
        boolean isDefault,
        LocalDateTime createdAt
) {}
