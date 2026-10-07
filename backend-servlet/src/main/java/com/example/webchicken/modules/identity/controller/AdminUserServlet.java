package com.example.webchicken.modules.identity.controller;

import com.example.webchicken.common.model.AuthenticatedUser;
import com.example.webchicken.modules.identity.model.dto.request.BanUserRequest;
import com.example.webchicken.modules.identity.model.dto.request.UnbanUserRequest;
import com.example.webchicken.modules.identity.model.dto.response.AccountBanResponse;
import com.example.webchicken.modules.identity.model.dto.response.AdminUserPageResponse;
import com.example.webchicken.modules.identity.model.dto.response.AdminUserResponse;
import com.example.webchicken.modules.identity.service.AdminUserService;
import com.example.webchicken.web.base.BaseApiServlet;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * Controller quản lý tài khoản người dùng bởi Quản trị viên (Admin).
 * Endpoints:
 * - GET  /api/v1/admin/users          : Phân trang danh sách users (filter: page, size, search, status, role)
 * - GET  /api/v1/admin/users/{id}     : Chi tiết tài khoản user
 * - GET  /api/v1/admin/users/{id}/bans: Lịch sử cấm của user
 * - POST /api/v1/admin/users/{id}/ban : Khóa/cấm tài khoản (thu hồi mọi session tức thì)
 * - POST /api/v1/admin/users/{id}/unban: Mở khóa tài khoản
 */
@WebServlet(name = "AdminUserServlet", urlPatterns = {"/api/v1/admin/users/*"})
public class AdminUserServlet extends BaseApiServlet {

    private AdminUserService adminUserService;

    public AdminUserServlet() {
        super();
    }

    public AdminUserServlet(ObjectMapper objectMapper) {
        super(objectMapper);
    }

    public AdminUserServlet(AdminUserService adminUserService, ObjectMapper objectMapper) {
        super(objectMapper);
        this.adminUserService = adminUserService;
    }

    private AdminUserService service() {
        if (adminUserService != null) {
            return adminUserService;
        }
        return getService("adminUserService");
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        AuthenticatedUser user = getAuthenticatedUser(req);
        if (user == null) {
            unauthorized(resp, "Vui lòng đăng nhập để tiếp tục.");
            return;
        }
        if (!user.isAdmin()) {
            forbidden(resp, "Bạn không có quyền truy cập module quản trị người dùng.");
            return;
        }

        String pathInfo = req.getPathInfo();
        if (pathInfo == null || pathInfo.equals("/") || pathInfo.isBlank()) {
            int page = getIntParam(req, "page", 1);
            int size = getIntParam(req, "size", 20);
            String search = getStringParam(req, "search", null);
            String status = getStringParam(req, "status", null);
            String role = getStringParam(req, "role", null);

            AdminUserPageResponse result = service().listUsers(page, size, search, status, role);
            ok(resp, result);
            return;
        }

        String trimmed = pathInfo.startsWith("/") ? pathInfo.substring(1) : pathInfo;
        String[] parts = trimmed.split("/");

        if (parts.length == 1) {
            String userId = parts[0];
            AdminUserResponse response = service().getUserDetail(userId);
            ok(resp, response);
            return;
        }

        if (parts.length == 2 && "bans".equalsIgnoreCase(parts[1])) {
            String userId = parts[0];
            List<AccountBanResponse> bans = service().getBanHistory(userId);
            ok(resp, bans);
            return;
        }

        notFound(resp, "Endpoint không tồn tại: " + req.getRequestURI());
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        AuthenticatedUser user = getAuthenticatedUser(req);
        if (user == null) {
            unauthorized(resp, "Vui lòng đăng nhập để tiếp tục.");
            return;
        }
        if (!user.isAdmin()) {
            forbidden(resp, "Bạn không có quyền quản trị người dùng.");
            return;
        }

        String pathInfo = req.getPathInfo();
        if (pathInfo == null || pathInfo.isBlank()) {
            notFound(resp, "Thiếu định danh tài khoản cần thao tác.");
            return;
        }

        String trimmed = pathInfo.startsWith("/") ? pathInfo.substring(1) : pathInfo;
        String[] parts = trimmed.split("/");

        if (parts.length == 2 && "ban".equalsIgnoreCase(parts[1])) {
            String userId = parts[0];
            BanUserRequest request = readBody(req, BanUserRequest.class);
            service().banUser(user.userId(), userId, request);
            ok(resp, Map.of(
                    "message", "Khóa tài khoản người dùng thành công và đã thu hồi tất cả phiên làm việc.",
                    "userId", userId
            ));
            return;
        }

        if (parts.length == 2 && "unban".equalsIgnoreCase(parts[1])) {
            String userId = parts[0];
            UnbanUserRequest request = null;
            try {
                request = readBody(req, UnbanUserRequest.class);
            } catch (Exception ignored) {
                request = new UnbanUserRequest("Mở khóa bởi Quản trị viên");
            }
            service().unbanUser(user.userId(), userId, request);
            ok(resp, Map.of(
                    "message", "Mở khóa tài khoản người dùng thành công.",
                    "userId", userId
            ));
            return;
        }

        notFound(resp, "Endpoint POST không tồn tại: " + req.getRequestURI());
    }
}
