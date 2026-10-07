package com.example.webchicken.modules.backoffice.controller;

import com.example.webchicken.common.model.AuthenticatedUser;
import com.example.webchicken.modules.backoffice.model.dto.response.AuditLogPageResponse;
import com.example.webchicken.modules.backoffice.model.dto.response.AuditLogResponse;
import com.example.webchicken.modules.backoffice.service.AuditLogService;
import com.example.webchicken.web.base.BaseApiServlet;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

/**
 * Controller tra cứu nhật ký kiểm toán quản trị (Admin Audit Log Ledger).
 * Endpoints:
 * - GET /api/v1/admin/audit-logs     : Phân trang danh sách nhật ký kiểm toán (hỗ trợ lọc action, targetType, search)
 * - GET /api/v1/admin/audit-logs/{id}: Chi tiết một bản ghi nhật ký kiểm toán
 */
@WebServlet(name = "AuditLogServlet", urlPatterns = {"/api/v1/admin/audit-logs/*"})
public class AuditLogServlet extends BaseApiServlet {

    private AuditLogService auditLogService;

    public AuditLogServlet() {
        super();
    }

    public AuditLogServlet(ObjectMapper objectMapper) {
        super(objectMapper);
    }

    public AuditLogServlet(AuditLogService auditLogService, ObjectMapper objectMapper) {
        super(objectMapper);
        this.auditLogService = auditLogService;
    }

    private AuditLogService service() {
        if (auditLogService != null) {
            return auditLogService;
        }
        return getService("auditLogService");
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        AuthenticatedUser user = getAuthenticatedUser(req);
        if (user == null) {
            unauthorized(resp, "Vui lòng đăng nhập để tiếp tục.");
            return;
        }
        if (!user.isAdmin()) {
            forbidden(resp, "Bạn không có quyền truy cập nhật ký kiểm toán hệ thống.");
            return;
        }

        String pathInfo = req.getPathInfo();
        if (pathInfo == null || pathInfo.equals("/") || pathInfo.isBlank()) {
            int page = getIntParam(req, "page", 1);
            int size = getIntParam(req, "size", 20);
            String adminId = getStringParam(req, "adminId", null);
            String action = getStringParam(req, "action", null);
            String targetType = getStringParam(req, "targetType", null);
            String search = getStringParam(req, "search", null);

            AuditLogPageResponse result = service().listLogs(page, size, adminId, action, targetType, search);
            ok(resp, result);
            return;
        }

        String logId = pathInfo.startsWith("/") ? pathInfo.substring(1).trim() : pathInfo.trim();
        if (!logId.isEmpty()) {
            AuditLogResponse result = service().getById(logId);
            ok(resp, result);
            return;
        }

        notFound(resp, "Endpoint không tồn tại: " + req.getRequestURI());
    }
}
