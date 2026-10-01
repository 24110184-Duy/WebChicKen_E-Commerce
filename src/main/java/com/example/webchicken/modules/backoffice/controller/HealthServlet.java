package com.example.webchicken.modules.backoffice.controller;

import com.example.webchicken.web.base.BaseApiServlet;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * Health check.
 * - KHÔNG chứa logic nghiệp vụ (chuyển ngay xuống Service).
 * - Inject Service qua constructor, đăng ký bởi CompositionRoot.
 */
@WebServlet(name = "HealthServlet", urlPatterns = {"/api/v1/system/health/*"})
public class HealthServlet extends BaseApiServlet {

    public HealthServlet(ObjectMapper objectMapper) {
        super(objectMapper);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        // TODO: delegate to service
        ok(resp, "TODO");
    }
}
