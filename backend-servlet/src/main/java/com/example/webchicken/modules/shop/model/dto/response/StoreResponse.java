package com.example.webchicken.modules.shop.model.dto.response;

import java.time.LocalDateTime;

/**
 * Thông tin phản hồi gian hàng (Store).
 */
public record StoreResponse(
        String id,
        String storeName,
        String storeType,
        String sellerId,
        LocalDateTime createdAt
) {}
