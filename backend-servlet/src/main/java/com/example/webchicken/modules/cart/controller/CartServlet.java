package com.example.webchicken.modules.cart.controller;

import com.example.webchicken.common.exception.AppException;
import com.example.webchicken.common.model.ApiResponse;
import com.example.webchicken.common.model.AuthenticatedUser;
import com.example.webchicken.modules.cart.model.dto.request.AddToCartRequest;
import com.example.webchicken.modules.cart.model.dto.request.UpdateCartItemRequest;
import com.example.webchicken.modules.cart.model.dto.response.CartResponse;
import com.example.webchicken.modules.cart.service.CartService;
import com.example.webchicken.web.base.BaseApiServlet;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

/**
 * RESTful Controller quản lý giỏ hàng trực tuyến (TASK-40).
 * URL Patterns: /api/v1/cart, /api/v1/cart/*, /api/v1/carts/current, /api/v1/carts/current/*
 */
@WebServlet(name = "CartServlet", urlPatterns = {"/api/v1/cart", "/api/v1/cart/*", "/api/v1/carts/current", "/api/v1/carts/current/*"})
public class CartServlet extends BaseApiServlet {

    public CartServlet() {
        super();
    }

    public CartServlet(ObjectMapper objectMapper) {
        super(objectMapper);
    }

    private CartService cartService() {
        return getService("cartService");
    }

    private String resolveCustomerId(HttpServletRequest req) {
        AuthenticatedUser user = getAuthenticatedUser(req);
        if (user != null && user.userId() != null) {
            return user.userId();
        }
        // Hỗ trợ header dự phòng cho môi trường dev/kiểm thử
        String headerCustId = req.getHeader("X-Customer-Id");
        if (headerCustId != null && !headerCustId.isBlank()) {
            return headerCustId;
        }
        return null;
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String customerId = resolveCustomerId(req);
        if (customerId == null) {
            unauthorized(resp, "Vui lòng đăng nhập để xem giỏ hàng.");
            return;
        }

        try {
            CartResponse cart = cartService().getCart(customerId);
            ok(resp, cart);
        } catch (AppException e) {
            writeJson(resp, e.getHttpStatus(), ApiResponse.fail(com.example.webchicken.common.model.ApiError.of(e.getErrorCode(), e.getMessage())));
        } catch (Exception e) {
            badRequest(resp, "INTERNAL_ERROR", e.getMessage());
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String customerId = resolveCustomerId(req);
        if (customerId == null) {
            unauthorized(resp, "Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.");
            return;
        }

        try {
            AddToCartRequest body = readBody(req, AddToCartRequest.class);
            CartResponse cart = cartService().addItem(customerId, body);
            ok(resp, cart);
        } catch (AppException e) {
            writeJson(resp, e.getHttpStatus(), ApiResponse.fail(com.example.webchicken.common.model.ApiError.of(e.getErrorCode(), e.getMessage())));
        } catch (Exception e) {
            badRequest(resp, "BAD_REQUEST", e.getMessage());
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String customerId = resolveCustomerId(req);
        if (customerId == null) {
            unauthorized(resp, "Vui lòng đăng nhập để chỉnh sửa giỏ hàng.");
            return;
        }

        String pathInfo = req.getPathInfo(); // e.g. /items/{id} or /{id}
        String itemId = extractItemId(pathInfo);
        if (itemId == null) {
            badRequest(resp, "MISSING_ITEM_ID", "Item ID must be provided in path: /cart/items/{id}");
            return;
        }

        try {
            UpdateCartItemRequest body = readBody(req, UpdateCartItemRequest.class);
            CartResponse cart = cartService().updateItemQuantity(customerId, itemId, body.quantity());
            ok(resp, cart);
        } catch (AppException e) {
            writeJson(resp, e.getHttpStatus(), ApiResponse.fail(com.example.webchicken.common.model.ApiError.of(e.getErrorCode(), e.getMessage())));
        } catch (Exception e) {
            badRequest(resp, "BAD_REQUEST", e.getMessage());
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String customerId = resolveCustomerId(req);
        if (customerId == null) {
            unauthorized(resp, "Vui lòng đăng nhập để thao tác giỏ hàng.");
            return;
        }

        String pathInfo = req.getPathInfo();
        String itemId = extractItemId(pathInfo);

        try {
            if (itemId != null) {
                // Xóa một món
                CartResponse cart = cartService().removeItem(customerId, itemId);
                ok(resp, cart);
            } else {
                // Làm trống giỏ hàng
                cartService().clearCart(customerId);
                noContent(resp);
            }
        } catch (AppException e) {
            writeJson(resp, e.getHttpStatus(), ApiResponse.fail(com.example.webchicken.common.model.ApiError.of(e.getErrorCode(), e.getMessage())));
        } catch (Exception e) {
            badRequest(resp, "BAD_REQUEST", e.getMessage());
        }
    }

    private String extractItemId(String pathInfo) {
        if (pathInfo == null || pathInfo.isBlank() || pathInfo.equals("/")) {
            return null;
        }
        String cleaned = pathInfo.startsWith("/") ? pathInfo.substring(1) : pathInfo;
        if (cleaned.startsWith("items/")) {
            return cleaned.substring("items/".length());
        }
        return cleaned;
    }
}
