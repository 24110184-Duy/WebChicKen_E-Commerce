package com.example.webchicken.modules.shop.controller;

import com.example.webchicken.web.base.BaseApiServlet;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * SellerApplication.
 * - KHÔNG chứa logic nghiệp vụ (chuyển ngay xuống Service).
 * - Inject Service qua constructor, đăng ký bởi CompositionRoot.
 */
@WebServlet(name = "SellerApplicationServlet", urlPatterns = {"/api/v1/seller-applications/*"})
public class SellerApplicationServlet extends BaseApiServlet {

    public SellerApplicationServlet(ObjectMapper objectMapper) {
        super(objectMapper);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        // TODO: delegate to service
        ok(resp, "TODO");
    }
}
