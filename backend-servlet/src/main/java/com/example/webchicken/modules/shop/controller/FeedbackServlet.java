package com.example.webchicken.modules.shop.controller;

import com.example.webchicken.common.model.AuthenticatedUser;
import com.example.webchicken.modules.shop.model.dto.request.CreateFeedbackRequest;
import com.example.webchicken.modules.shop.model.dto.request.RespondFeedbackRequest;
import com.example.webchicken.modules.shop.model.dto.response.FeedbackPageResponse;
import com.example.webchicken.modules.shop.model.dto.response.FeedbackResponse;
import com.example.webchicken.modules.shop.service.FeedbackService;
import com.example.webchicken.web.base.BaseApiServlet;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

/**
 * Controller xử lý tiếp nhận phản hồi / khiếu nại từ Nhà Bán và Quản trị viên phản hồi (TASK-69).
 * Endpoints:
 * - POST /api/v1/seller/feedbacks           : Seller gửi phản hồi / khiếu nại mới
 * - GET  /api/v1/seller/feedbacks           : Seller tra cứu lịch sử các phản hồi đã gửi
 * - GET  /api/v1/admin/feedbacks            : Admin phân trang, lọc danh sách phản hồi từ Sellers
 * - GET  /api/v1/admin/feedbacks/{id}       : Admin xem chi tiết 1 phản hồi
 * - PUT  /api/v1/admin/feedbacks/{id}/respond: Admin giải quyết / phản hồi phiếu
 */
@WebServlet(name = "FeedbackServlet", urlPatterns = {
        "/api/v1/feedbacks/*",
        "/api/v1/seller/feedbacks/*",
        "/api/v1/admin/feedbacks/*"
})
public class FeedbackServlet extends BaseApiServlet {

    private FeedbackService feedbackService;

    public FeedbackServlet() {
        super();
    }

    public FeedbackServlet(ObjectMapper objectMapper) {
        super(objectMapper);
    }

    public FeedbackServlet(FeedbackService feedbackService, ObjectMapper objectMapper) {
        super(objectMapper);
        this.feedbackService = feedbackService;
    }

    private FeedbackService service() {
        if (feedbackService != null) {
            return feedbackService;
        }
        return getService("feedbackService");
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        AuthenticatedUser user = getAuthenticatedUser(req);
        if (user == null) {
            unauthorized(resp, "Vui lòng đăng nhập để tiếp tục.");
            return;
        }

        String uri = req.getRequestURI();

        // 1. Tuyến đường dành cho Quản trị viên
        if (uri.contains("/admin/feedbacks")) {
            if (!user.isAdmin()) {
                forbidden(resp, "Bạn không có quyền truy cập hòm thư phản hồi của Ban Quản Trị.");
                return;
            }

            String pathInfo = req.getPathInfo();
            if (pathInfo == null || pathInfo.equals("/") || pathInfo.isBlank()) {
                int page = getIntParam(req, "page", 1);
                int size = getIntParam(req, "size", 20);
                String status = getStringParam(req, "status", null);
                String type = getStringParam(req, "type", null);
                String search = getStringParam(req, "search", null);

                FeedbackPageResponse result = service().listAdminFeedbacks(page, size, status, type, search);
                ok(resp, result);
                return;
            }

            String feedbackId = pathInfo.startsWith("/") ? pathInfo.substring(1).trim() : pathInfo.trim();
            if (!feedbackId.isBlank() && !feedbackId.contains("/")) {
                FeedbackResponse detail = service().getFeedbackDetail(feedbackId);
                ok(resp, detail);
                return;
            }

            notFound(resp, "Endpoint không tồn tại: " + uri);
            return;
        }

        // 2. Tuyến đường dành cho Người bán tra cứu lịch sử phản hồi
        int page = getIntParam(req, "page", 1);
        int size = getIntParam(req, "size", 20);
        FeedbackPageResponse result = service().getSellerFeedbacks(user.userId(), page, size);
        ok(resp, result);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        AuthenticatedUser user = getAuthenticatedUser(req);
        if (user == null) {
            unauthorized(resp, "Vui lòng đăng nhập để gửi phản hồi.");
            return;
        }

        CreateFeedbackRequest body = readBody(req, CreateFeedbackRequest.class);
        FeedbackResponse created = service().createFeedback(user.userId(), body);
        created(resp, created);
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        AuthenticatedUser user = getAuthenticatedUser(req);
        if (user == null) {
            unauthorized(resp, "Vui lòng đăng nhập để tiếp tục.");
            return;
        }
        if (!user.isAdmin()) {
            forbidden(resp, "Chỉ Quản trị viên mới có quyền giải quyết và phản hồi phiếu khiếu nại.");
            return;
        }

        String pathInfo = req.getPathInfo();
        if (pathInfo == null) pathInfo = "";

        // URL format: /{id}/respond hoặc /{id}
        String feedbackId = null;
        if (pathInfo.endsWith("/respond")) {
            String[] parts = pathInfo.split("/");
            if (parts.length >= 3) {
                feedbackId = parts[1];
            }
        } else if (pathInfo.startsWith("/")) {
            feedbackId = pathInfo.substring(1).trim();
        }

        if (feedbackId == null || feedbackId.isBlank()) {
            badRequest(resp, "MISSING_ID", "Mã phản hồi không hợp lệ.");
            return;
        }

        RespondFeedbackRequest body = readBody(req, RespondFeedbackRequest.class);
        FeedbackResponse response = service().respondFeedback(feedbackId, user.userId(), body, req.getRemoteAddr());
        ok(resp, response);
    }
}
