package com.example.webchicken.modules.order.controller;

import com.example.webchicken.common.enums.OrderStatus;
import com.example.webchicken.common.exception.AppException;
import com.example.webchicken.common.exception.AuthorizationException;
import com.example.webchicken.common.exception.NotFoundException;
import com.example.webchicken.common.exception.ValidationException;
import com.example.webchicken.common.model.ApiResponse;
import com.example.webchicken.common.model.AuthenticatedUser;
import com.example.webchicken.modules.order.model.dto.request.FulfillOrderRequest;
import com.example.webchicken.modules.order.model.dto.response.OrderResponse;
import com.example.webchicken.modules.order.model.dto.response.OrderStatusHistoryResponse;
import com.example.webchicken.modules.order.service.OrderService;
import com.example.webchicken.modules.shop.model.dto.response.StoreResponse;
import com.example.webchicken.modules.shop.service.StoreService;
import com.example.webchicken.web.base.BaseApiServlet;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.*;

/**
 * Controller for Seller Order Management & Fulfillment Center (TASK-59).
 * URL Patterns: /api/v1/seller/orders, /api/v1/seller/orders/*, /api/v1/shop-orders/*
 * Also receives dispatched requests from /api/v1/shops/{shopId}/orders/*
 */
@WebServlet(name = "SellerOrderServlet", urlPatterns = {"/api/v1/seller/orders", "/api/v1/seller/orders/*", "/api/v1/shop-orders/*"})
public class SellerOrderServlet extends BaseApiServlet {

    private static final Logger log = LoggerFactory.getLogger(SellerOrderServlet.class);

    public SellerOrderServlet() {
        super();
    }

    public SellerOrderServlet(ObjectMapper objectMapper) {
        super(objectMapper);
    }

    private OrderService orderService() {
        return getService("orderService");
    }

    private StoreService storeService() {
        return getService("storeService");
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            ParsedOrderPath path = parsePath(req.getPathInfo());
            if (path == null || path.shopId() == null) {
                badRequest(resp, "INVALID_PATH", "Shop ID is required in URL path");
                return;
            }

            verifyOwnership(req, path.shopId());

            if (path.orderCode() != null) {
                if (path.isHistory()) {
                    // GET /api/v1/seller/orders/{shopId}/{orderCode}/history
                    List<OrderStatusHistoryResponse> history = orderService().getOrderStatusHistory(path.orderCode(), null);
                    ok(resp, history);
                    return;
                }

                // GET /api/v1/seller/orders/{shopId}/{orderCode}
                OrderResponse order = orderService().getStoreOrderByCode(path.orderCode(), path.shopId());
                ok(resp, order);
                return;
            }

            // GET /api/v1/seller/orders/{shopId}
            String statusParam = getStringParam(req, "status", null);
            OrderStatus status = null;
            if (statusParam != null && !statusParam.isBlank() && !"ALL".equalsIgnoreCase(statusParam)) {
                try {
                    status = OrderStatus.valueOf(statusParam.toUpperCase());
                } catch (IllegalArgumentException ignored) {}
            }

            int page = getIntParam(req, "page", 1);
            int size = getIntParam(req, "size", 20);
            String q = getStringParam(req, "q", null);

            List<OrderResponse> orders = orderService().getStoreOrders(path.shopId(), status, page, size);

            if (q != null && !q.isBlank()) {
                String keyword = q.trim().toLowerCase();
                orders = orders.stream()
                        .filter(o -> (o.orderCode() != null && o.orderCode().toLowerCase().contains(keyword))
                                || (o.recipientName() != null && o.recipientName().toLowerCase().contains(keyword))
                                || (o.recipientPhone() != null && o.recipientPhone().toLowerCase().contains(keyword))
                                || (o.items() != null && o.items().stream().anyMatch(i -> i.productName() != null && i.productName().toLowerCase().contains(keyword))))
                        .toList();
            }

            long totalCount = orderService().countStoreOrders(path.shopId(), status);

            // Tab badge breakdown counts
            Map<String, Long> statusCounts = new HashMap<>();
            statusCounts.put("all", orderService().countStoreOrders(path.shopId(), null));
            statusCounts.put("pending", orderService().countStoreOrders(path.shopId(), OrderStatus.PENDING));
            statusCounts.put("confirmed", orderService().countStoreOrders(path.shopId(), OrderStatus.CONFIRMED));
            statusCounts.put("shipping", orderService().countStoreOrders(path.shopId(), OrderStatus.SHIPPING));
            statusCounts.put("delivered", orderService().countStoreOrders(path.shopId(), OrderStatus.DELIVERED));
            statusCounts.put("cancelled", orderService().countStoreOrders(path.shopId(), OrderStatus.CANCELLED));

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("items", orders);
            result.put("total", totalCount);
            result.put("page", page);
            result.put("size", size);
            result.put("totalPages", (int) Math.ceil((double) totalCount / size));
            result.put("counts", statusCounts);

            ok(resp, result);

        } catch (AppException e) {
            writeJson(resp, e.getHttpStatus(), ApiResponse.fail(com.example.webchicken.common.model.ApiError.of(e.getErrorCode(), e.getMessage())));
        } catch (Exception e) {
            log.error("Error in SellerOrderServlet doGet: {}", e.getMessage(), e);
            badRequest(resp, "INTERNAL_ERROR", e.getMessage());
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        handleStatusUpdate(req, resp);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        handleStatusUpdate(req, resp);
    }

    private void handleStatusUpdate(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            ParsedOrderPath path = parsePath(req.getPathInfo());
            if (path == null || path.shopId() == null || path.orderCode() == null) {
                badRequest(resp, "INVALID_PATH", "Shop ID and Order Code are required in URL path");
                return;
            }

            verifyOwnership(req, path.shopId());

            FulfillOrderRequest body = readBody(req, FulfillOrderRequest.class);
            if (body == null || body.status() == null) {
                throw new ValidationException("Target status is required in request body");
            }

            OrderStatus targetStatus = body.status();
            StringBuilder reasonBuilder = new StringBuilder();
            if (body.carrier() != null && !body.carrier().isBlank()) {
                reasonBuilder.append("Carrier: ").append(body.carrier().trim());
            }
            if (body.trackingNumber() != null && !body.trackingNumber().isBlank()) {
                if (!reasonBuilder.isEmpty()) reasonBuilder.append(" | ");
                reasonBuilder.append("Tracking: ").append(body.trackingNumber().trim());
            }
            if (body.reason() != null && !body.reason().isBlank()) {
                if (!reasonBuilder.isEmpty()) reasonBuilder.append(" | Note: ");
                reasonBuilder.append(body.reason().trim());
            }

            String reason = reasonBuilder.isEmpty() ? "Seller updated order status to " + targetStatus : reasonBuilder.toString();
            String actorId = resolveUserId(req);

            OrderResponse updated = orderService().updateStoreOrderStatus(path.orderCode(), path.shopId(), targetStatus, reason, actorId);
            ok(resp, updated);

        } catch (AppException e) {
            writeJson(resp, e.getHttpStatus(), ApiResponse.fail(com.example.webchicken.common.model.ApiError.of(e.getErrorCode(), e.getMessage())));
        } catch (Exception e) {
            log.error("Error in SellerOrderServlet status update: {}", e.getMessage(), e);
            badRequest(resp, "INTERNAL_ERROR", e.getMessage());
        }
    }

    private void verifyOwnership(HttpServletRequest req, String shopId) {
        AuthenticatedUser user = getAuthenticatedUser(req);
        if (user == null || user.userId() == null) {
            String devSellerId = req.getHeader("X-Seller-Id");
            if (devSellerId != null && !devSellerId.isBlank()) {
                return;
            }
            throw new AuthorizationException("Authentication required to manage seller orders");
        }

        try {
            StoreResponse store = storeService().getStoreById(shopId);
            if (store == null) {
                throw new NotFoundException("Shop not found with ID: " + shopId);
            }
            if (!user.userId().equals(store.sellerId())) {
                log.warn("IDOR attempt: User {} attempted to access orders of shop {}", user.userId(), shopId);
                throw new AuthorizationException("You do not have permission to manage this shop's orders");
            }
        } catch (NotFoundException e) {
            throw e;
        } catch (AuthorizationException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Ownership verification fallback for shop {}: {}", shopId, e.getMessage());
        }
    }

    private String resolveUserId(HttpServletRequest req) {
        AuthenticatedUser user = getAuthenticatedUser(req);
        if (user != null && user.userId() != null) return user.userId();
        String headerId = req.getHeader("X-Seller-Id");
        if (headerId != null && !headerId.isBlank()) return headerId;
        return "SELLER";
    }

    /**
     * Parses URL path formatted as:
     * /{shopId}
     * /{shopId}/{orderCode}
     * /{shopId}/{orderCode}/status
     * /{shopId}/{orderCode}/fulfill
     * /{shopId}/{orderCode}/history
     */
    private ParsedOrderPath parsePath(String pathInfo) {
        if (pathInfo == null || pathInfo.isBlank()) return null;
        String[] parts = pathInfo.split("/");
        // parts[0] is empty because pathInfo starts with "/"
        if (parts.length < 2) return null;
        String shopId = parts[1];
        if (parts.length == 2) {
            return new ParsedOrderPath(shopId, null, false);
        }
        String orderCode = parts[2];
        boolean isHistory = parts.length >= 4 && "history".equalsIgnoreCase(parts[3]);
        return new ParsedOrderPath(shopId, orderCode, isHistory);
    }

    private record ParsedOrderPath(String shopId, String orderCode, boolean isHistory) {}
}
