package com.example.webchicken.modules.backoffice.model.dto.response;

import java.time.LocalDateTime;

/**
 * Thông tin chi tiết một bản ghi nhật ký kiểm toán quản trị.
 */
public record AuditLogResponse(
        String id,
        String adminId,
        String adminEmail,
        String adminName,
        String action,
        String targetType,
        String targetId,
        String detail,
        String ipAddress,
        LocalDateTime createdAt
) {}
