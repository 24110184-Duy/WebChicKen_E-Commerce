package com.example.webchicken.modules.shop.model.dto.request;

/**
 * Request nộp đơn đăng ký làm Người bán (Seller).
 */
public record ApplySellerRequest(
        String shopName,
        String documentUrl,
        String taxCode,
        String ownerName,
        String phone,
        String email,
        String farmLocation,
        String farmType,
        String certificateType,
        String certificateNumber,
        String certificateExpiry,
        String dailyCapacity
) {}
