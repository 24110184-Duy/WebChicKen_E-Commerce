package com.example.webchicken.modules.order.controller;

import com.example.webchicken.web.base.BaseApiServlet;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * Đặt hàng.
 * - KHÔNG chứa logic nghiệp vụ (chuyển ngay xuống Service).
 * - Inject Service qua constructor, đăng ký bởi CompositionRoot.
 */
@WebServlet(name = "CheckoutServlet", urlPatterns = {"/api/v1/checkouts/*"})
public class CheckoutServlet extends BaseApiServlet {

    public CheckoutServlet(ObjectMapper objectMapper) {
        super(objectMapper);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        // TODO: delegate to service
        ok(resp, "TODO");
    }
}
