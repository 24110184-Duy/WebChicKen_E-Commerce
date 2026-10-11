package com.example.webchicken.modules.order.controller;

import com.example.webchicken.common.enums.OrderStatus;
import com.example.webchicken.common.exception.AppException;
import com.example.webchicken.common.model.ApiResponse;
import com.example.webchicken.common.model.AuthenticatedUser;
import com.example.webchicken.modules.order.model.dto.request.CancelOrderRequest;
import com.example.webchicken.modules.order.model.dto.request.UpdateOrderStatusRequest;
import com.example.webchicken.modules.order.model.dto.response.OrderResponse;
import com.example.webchicken.modules.order.model.dto.response.OrderStatusHistoryResponse;
import com.example.webchicken.modules.order.model.enums.OrderActorType;
import com.example.webchicken.modules.order.service.OrderService;
import com.example.webchicken.web.base.BaseApiServlet;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;

/**
 * RESTful Controller for Order Management & State Machine (TASK-46, TASK-49, TASK-54).
 * URL Patterns: /api/v1/orders, /api/v1/orders/*
 */
@WebServlet(name = "OrderServlet", urlPatterns = {"/api/v1/orders", "/api/v1/orders/*", "/api/v1/admin/orders", "/api/v1/admin/orders/*"})
public class OrderServlet extends BaseApiServlet {

    public OrderServlet() {
        super();
    }

    public OrderServlet(ObjectMapper objectMapper) {
        super(objectMapper);
    }

    private OrderService orderService() {
        return getService("orderService");
    }

    private String resolveCustomerId(HttpServletRequest req) {
        AuthenticatedUser user = getAuthenticatedUser(req);
        if (user != null && user.userId() != null) {
            return user.userId();
        }
        String headerCustId = req.getHeader("X-Customer-Id");
        if (headerCustId != null && !headerCustId.isBlank()) {
            return headerCustId;
        }
        return null;
    }

    private boolean isAdmin(HttpServletRequest req) {
        AuthenticatedUser user = getAuthenticatedUser(req);
        if (user == null || user.roles() == null) return false;
        return user.roles().stream().anyMatch(r ->
                "ADMIN".equalsIgnoreCase(r) || "SUPER_ADMIN".equalsIgnoreCase(r) || "MODERATOR".equalsIgnoreCase(r));
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        AuthenticatedUser user = getAuthenticatedUser(req);
        boolean admin = isAdmin(req);
        boolean isPlatformPath = req.getRequestURI() != null && req.getRequestURI().contains("/admin/orders");

        String customerId = resolveCustomerId(req);
        if (customerId == null && !admin) {
            unauthorized(resp, "Please login to view order information.");
            return;
        }

        String pathInfo = req.getPathInfo();
        try {
            if (pathInfo == null || pathInfo.equals("/")) {
                String statusParam = req.getParameter("status");
                OrderStatus status = null;
                if (statusParam != null && !statusParam.isBlank() && !statusParam.equalsIgnoreCase("ALL")) {
                    try {
                        status = OrderStatus.valueOf(statusParam.toUpperCase());
                    } catch (IllegalArgumentException ignored) {}
                }

                int page = 1;
                int size = 10;
                try {
                    if (req.getParameter("page") != null) page = Integer.parseInt(req.getParameter("page"));
                    if (req.getParameter("size") != null) size = Integer.parseInt(req.getParameter("size"));
                } catch (NumberFormatException ignored) {}

                // Nếu là Admin gọi danh sách đơn toàn sàn
                if (admin && (isPlatformPath || "platform".equalsIgnoreCase(req.getParameter("scope")) || "all".equalsIgnoreCase(req.getParameter("scope")))) {
                    List<OrderResponse> orders = orderService().getAllPlatformOrders(status, page, size);
                    ok(resp, orders);
                    return;
                }

                // Người mua bình thường xem đơn của mình
                List<OrderResponse> orders = orderService().getOrders(customerId, status, page, size);
                ok(resp, orders);
            } else if (pathInfo.endsWith("/history")) {
                // GET /api/v1/orders/{orderCode}/history (TASK-54 Timeline)
                String orderCode = pathInfo.replaceFirst("/", "").replace("/history", "").trim();
                List<OrderStatusHistoryResponse> history = orderService().getOrderStatusHistory(orderCode, admin ? null : customerId);
                ok(resp, history);
            } else {
                String orderCode = pathInfo.replaceFirst("/", "").trim();
                // Admin có quyền tra cứu đơn bất kỳ mà không bị IDOR check
                OrderResponse order = orderService().getOrderByCode(orderCode, admin ? null : customerId);
                ok(resp, order);
            }
        } catch (AppException e) {
            writeJson(resp, e.getHttpStatus(), ApiResponse.fail(com.example.webchicken.common.model.ApiError.of(e.getErrorCode(), e.getMessage())));
        } catch (Exception e) {
            badRequest(resp, "INTERNAL_ERROR", e.getMessage());
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        AuthenticatedUser user = getAuthenticatedUser(req);
        boolean admin = isAdmin(req);
        String customerId = resolveCustomerId(req);
        if (customerId == null && !admin) {
            unauthorized(resp, "Please login to perform order actions.");
            return;
        }

        String pathInfo = req.getPathInfo(); // e.g. /{orderCode}/cancel or /{orderCode}/status
        if (pathInfo == null) {
            badRequest(resp, "INVALID_ENDPOINT", "Endpoint path is required");
            return;
        }

        try {
            if (pathInfo.endsWith("/cancel")) {
                // POST /api/v1/orders/{orderCode}/cancel
                String orderCode = pathInfo.replaceFirst("/", "").replace("/cancel", "").trim();
                CancelOrderRequest body = null;
                try {
                    body = readBody(req, CancelOrderRequest.class);
                } catch (Exception ignored) {}

                String reason = body != null ? body.reason() : (admin ? "Quản trị viên can thiệp hủy đơn" : "Customer requested cancellation");
                OrderResponse cancelled = orderService().cancelOrder(orderCode, admin ? null : customerId, reason);
                ok(resp, cancelled);
            } else if (pathInfo.endsWith("/status")) {
                // POST /api/v1/orders/{orderCode}/status (State Machine Transition)
                String orderCode = pathInfo.replaceFirst("/", "").replace("/status", "").trim();
                UpdateOrderStatusRequest body = readBody(req, UpdateOrderStatusRequest.class);
                if (body == null || body.status() == null) {
                    badRequest(resp, "INVALID_PAYLOAD", "Target order status is required");
                    return;
                }
                OrderActorType actorType = admin ? OrderActorType.ADMIN : (body.actorType() != null ? body.actorType() : OrderActorType.SELLER);
                String actorId = admin ? (user != null ? user.userId() : "admin") : customerId;
                OrderResponse updated = orderService().updateOrderStatus(orderCode, body.status(), actorType, actorId, body.reason());
                ok(resp, updated);
            } else {
                badRequest(resp, "INVALID_ENDPOINT", "Endpoint not supported: " + pathInfo);
            }
        } catch (AppException e) {
            writeJson(resp, e.getHttpStatus(), ApiResponse.fail(com.example.webchicken.common.model.ApiError.of(e.getErrorCode(), e.getMessage())));
        } catch (Exception e) {
            badRequest(resp, "OPERATION_FAILED", e.getMessage());
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if (!isAdmin(req)) {
            forbidden(resp, "Chỉ Quản trị viên mới có quyền xóa đơn hàng.");
            return;
        }

        String pathInfo = req.getPathInfo();
        if (pathInfo == null || pathInfo.length() <= 1) {
            badRequest(resp, "MISSING_CODE", "Mã đơn hàng không được để trống.");
            return;
        }

        String orderCode = pathInfo.replaceFirst("^/", "").trim();
        try {
            orderService().deleteOrderAsAdmin(orderCode);
            ok(resp, java.util.Map.of("deleted", true, "orderCode", orderCode));
        } catch (AppException e) {
            writeJson(resp, e.getHttpStatus(), ApiResponse.fail(com.example.webchicken.common.model.ApiError.of(e.getErrorCode(), e.getMessage())));
        } catch (Exception e) {
            badRequest(resp, "OPERATION_FAILED", e.getMessage());
        }
    }
}
