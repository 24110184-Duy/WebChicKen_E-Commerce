package com.example.webchicken.modules.identity.model.dto.response;

import java.time.LocalDateTime;

/**
 * Thông tin chi tiết một lệnh cấm/khóa tài khoản.
 */
public record AccountBanResponse(
        String banId,
        String userId,
        String description,
        LocalDateTime bannedAt,
        LocalDateTime bannedUntil,
        String bannedBy,
        LocalDateTime unbannedAt,
        boolean isActive
) {}
