package com.example.webchicken.modules.identity.model.dto.request;

/** Thêm mới hoặc cập nhật địa chỉ giao hàng */
public record CreateAddressRequest(
        String recipientName,
        String phone,
        String addressLine1,
        String district,
        String city,
        boolean isDefault
) {}
