package com.example.webchicken.modules.backoffice.service;

import com.example.webchicken.modules.backoffice.model.dto.response.AuditLogPageResponse;
import com.example.webchicken.modules.backoffice.model.dto.response.AuditLogResponse;

/**
 * Service ghi nhận và truy vấn nhật ký kiểm toán quản trị (Admin Audit Logging).
 * Mọi thao tác ghi dữ liệu nhạy cảm của Admin phải được lưu vết không thể chỉnh sửa (TASK-67).
 */
public interface AuditLogService {

    /**
     * Ghi nhận một thao tác nhạy cảm của Admin.
     */
    void log(String adminId, String action, String targetType, String targetId, String detail, String ipAddress);

    /**
     * Lấy danh sách nhật ký kiểm toán có phân trang và bộ lọc.
     */
    AuditLogPageResponse listLogs(int page, int size, String adminId, String action, String targetType, String search);

    /**
     * Lấy thông tin chi tiết một bản ghi nhật ký kiểm toán.
     */
    AuditLogResponse getById(String id);
}
