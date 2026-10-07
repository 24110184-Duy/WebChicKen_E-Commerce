package com.example.webchicken.modules.identity.model.dto.request;

import java.time.LocalDateTime;

/**
 * Yêu cầu khóa/cấm tài khoản người dùng bởi Admin.
 */
public record BanUserRequest(
        String reason,
        Integer durationDays,
        LocalDateTime bannedUntil
) {}
