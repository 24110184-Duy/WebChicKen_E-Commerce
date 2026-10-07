package com.example.webchicken.modules.identity.model.dto.response;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Thông tin người dùng dành cho Backoffice Admin.
 */
public record AdminUserResponse(
        String userId,
        String email,
        String fullName,
        String phone,
        String logoUrl,
        String status,
        List<String> roles,
        String tier,
        Integer loyaltyPoint,
        String storeId,
        String storeName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        AccountBanResponse activeBan
) {}
