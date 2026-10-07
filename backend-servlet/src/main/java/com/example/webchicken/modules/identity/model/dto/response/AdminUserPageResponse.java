package com.example.webchicken.modules.identity.model.dto.response;

import java.util.List;

/**
 * Kết quả phân trang danh sách người dùng cho Admin.
 */
public record AdminUserPageResponse(
        List<AdminUserResponse> items,
        long total,
        int page,
        int size,
        int totalPages
) {}
