package com.example.webchicken.modules.shop.model.dto.request;

/**
 * Request nộp đơn đăng ký làm Người bán (Seller).
 */
public record ApplySellerRequest(
        String shopName,
        String documentUrl,
        String taxCode
) {}
