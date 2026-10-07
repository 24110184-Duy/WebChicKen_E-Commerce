package com.example.webchicken.modules.identity.model.dto.request;

/**
 * Yêu cầu mở khóa tài khoản người dùng bởi Admin.
 */
public record UnbanUserRequest(
        String reason
) {}
