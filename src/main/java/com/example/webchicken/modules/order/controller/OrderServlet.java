package com.example.webchicken.modules.order.controller;

import com.example.webchicken.web.base.BaseApiServlet;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * Xem và quản lý Order.
 * - KHÔNG chứa logic nghiệp vụ (chuyển ngay xuống Service).
 * - Inject Service qua constructor, đăng ký bởi CompositionRoot.
 */
@WebServlet(name = "OrderServlet", urlPatterns = {"/api/v1/orders/*"})
public class OrderServlet extends BaseApiServlet {

    public OrderServlet(ObjectMapper objectMapper) {
        super(objectMapper);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        // TODO: delegate to service
        ok(resp, "TODO");
    }
}
