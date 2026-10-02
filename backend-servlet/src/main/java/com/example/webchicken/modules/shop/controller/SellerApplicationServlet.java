package com.example.webchicken.modules.shop.controller;

import com.example.webchicken.common.model.AuthenticatedUser;
import com.example.webchicken.modules.shop.model.dto.request.ApplySellerRequest;
import com.example.webchicken.modules.shop.model.dto.request.ReviewApplicationRequest;
import com.example.webchicken.modules.shop.model.dto.response.SellerApplicationResponse;
import com.example.webchicken.modules.shop.service.SellerApplicationService;
import com.example.webchicken.web.base.BaseApiServlet;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;

/**
 * Servlet xử lý quy trình nộp và duyệt đơn đăng ký Người bán: /api/v1/seller-applications/*
 * <ul>
 *   <li>POST /: Người mua nộp đơn đăng ký trở thành Người bán</li>
 *   <li>GET  /me: Người mua tra cứu hồ sơ đăng ký của mình</li>
 *   <li>GET  /: Quản trị viên xem danh sách các đơn đăng ký (hỗ trợ lọc status, page, size)</li>
 *   <li>PUT  /{id}/review: Quản trị viên duyệt (APPROVED) hoặc từ chối (REJECTED)</li>
 * </ul>
 */
@WebServlet(name = "SellerApplicationServlet", urlPatterns = {"/api/v1/seller-applications/*"})
public class SellerApplicationServlet extends BaseApiServlet {

    public SellerApplicationServlet() {
        super();
    }

    public SellerApplicationServlet(ObjectMapper objectMapper) {
        super(objectMapper);
    }

    private SellerApplicationService service() {
        return getService("sellerApplicationService");
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        AuthenticatedUser user = getAuthenticatedUser(req);
        if (user == null) {
            unauthorized(resp, "Vui lòng đăng nhập để tiếp tục.");
            return;
        }

        String pathInfo = req.getPathInfo();
        if (pathInfo == null || pathInfo.equals("/") || pathInfo.isBlank()) {
            // Admin xem danh sách
            if (!isAdmin(user)) {
                forbidden(resp, "Bạn không có quyền truy cập danh sách đơn đăng ký.");
                return;
            }
            int page = parseQueryInt(req, "page", 1);
            int size = parseQueryInt(req, "size", 20);
            String status = req.getParameter("status");

            List<SellerApplicationResponse> list = service().listApplications(page, size, status);
            ok(resp, list);
            return;
        }

        if ("/me".equalsIgnoreCase(pathInfo)) {
            SellerApplicationResponse myApp = service().getMyApplication(user.userId());
            if (myApp == null) {
                ok(resp, null);
            } else {
                ok(resp, myApp);
            }
            return;
        }

        notFound(resp, "Endpoint không tồn tại.");
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        AuthenticatedUser user = getAuthenticatedUser(req);
        if (user == null) {
            unauthorized(resp, "Vui lòng đăng nhập để nộp hồ sơ đăng ký.");
            return;
        }

        String pathInfo = req.getPathInfo();
        if (pathInfo == null || pathInfo.equals("/") || pathInfo.isBlank()) {
            ApplySellerRequest body = readBody(req, ApplySellerRequest.class);
            SellerApplicationResponse response = service().apply(user.userId(), body);
            created(resp, response);
            return;
        }

        notFound(resp, "Endpoint không tồn tại.");
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        AuthenticatedUser user = getAuthenticatedUser(req);
        if (user == null) {
            unauthorized(resp, "Vui lòng đăng nhập để tiếp tục.");
            return;
        }

        String pathInfo = req.getPathInfo();
        if (pathInfo == null) pathInfo = "";

        // Khớp route: /{id}/review
        if (pathInfo.endsWith("/review")) {
            if (!isAdmin(user)) {
                forbidden(resp, "Chỉ Quản trị viên mới có quyền duyệt đơn đăng ký.");
                return;
            }

            String[] parts = pathInfo.split("/");
            if (parts.length >= 3) {
                String applicationId = parts[1];
                ReviewApplicationRequest body = readBody(req, ReviewApplicationRequest.class);
                SellerApplicationResponse response = service().review(applicationId, user.userId(), body);
                ok(resp, response);
                return;
            }
        }

        notFound(resp, "Endpoint không tồn tại.");
    }

    private boolean isAdmin(AuthenticatedUser user) {
        if (user.roles() == null) return false;
        return user.roles().contains("SUPER_ADMIN") || user.roles().contains("MODERATOR") || user.roles().contains("ADMIN");
    }

    private int parseQueryInt(HttpServletRequest req, String param, int defaultValue) {
        String val = req.getParameter(param);
        if (val == null || val.isBlank()) return defaultValue;
        try {
            return Integer.parseInt(val.trim());
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }
}
