package com.example.webchicken.modules.order.controller;

import com.example.webchicken.common.exception.AppException;
import com.example.webchicken.common.model.ApiResponse;
import com.example.webchicken.common.model.AuthenticatedUser;
import com.example.webchicken.modules.order.model.dto.request.CheckoutRequest;
import com.example.webchicken.modules.order.model.dto.response.CheckoutResponse;
import com.example.webchicken.modules.order.service.OrderService;
import com.example.webchicken.web.base.BaseApiServlet;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

/**
 * RESTful Controller cho quá trình Đặt hàng (TASK-46).
 * URL Patterns: /api/v1/checkout, /api/v1/checkout/*, /api/v1/checkouts, /api/v1/checkouts/*
 */
@WebServlet(name = "CheckoutServlet", urlPatterns = {"/api/v1/checkout", "/api/v1/checkout/*", "/api/v1/checkouts", "/api/v1/checkouts/*"})
public class CheckoutServlet extends BaseApiServlet {

    public CheckoutServlet() {
        super();
    }

    public CheckoutServlet(ObjectMapper objectMapper) {
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

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String customerId = resolveCustomerId(req);
        if (customerId == null) {
            unauthorized(resp, "Vui lòng đăng nhập để tiến hành đặt hàng.");
            return;
        }

        try {
            CheckoutRequest body = readBody(req, CheckoutRequest.class);
            CheckoutResponse result = orderService().checkout(customerId, body);
            created(resp, result);
        } catch (AppException e) {
            writeJson(resp, e.getHttpStatus(), ApiResponse.fail(com.example.webchicken.common.model.ApiError.of(e.getErrorCode(), e.getMessage())));
        } catch (Exception e) {
            badRequest(resp, "BAD_REQUEST", e.getMessage());
        }
    }
}
