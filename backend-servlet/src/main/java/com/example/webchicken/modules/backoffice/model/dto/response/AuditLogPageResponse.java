package com.example.webchicken.modules.backoffice.model.dto.response;

import java.util.List;

/**
 * Phân trang nhật ký kiểm toán cho Admin (TASK-67).
 */
public record AuditLogPageResponse(
        List<AuditLogResponse> items,
        long total,
        int page,
        int size,
        int totalPages
) {}
