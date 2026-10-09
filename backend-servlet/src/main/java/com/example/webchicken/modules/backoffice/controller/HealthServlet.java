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
@WebServlet(name = "HealthServlet", urlPatterns = {"/api/v1/system/health", "/api/v1/system/health/*"})
public class HealthServlet extends BaseApiServlet {

    public HealthServlet() {
        super();
    }

    public HealthServlet(ObjectMapper objectMapper) {
        super(objectMapper);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        boolean isReadyCheck = pathInfo != null && pathInfo.contains("ready");

        java.util.Map<String, Object> healthData = new java.util.HashMap<>();
        healthData.put("timestamp", java.time.Instant.now().toString());
        healthData.put("application", "WebChicKen E-Commerce API");

        if (isReadyCheck) {
            Object emfObj = getServletContext().getAttribute("emf");
            boolean dbConnected = false;
            if (emfObj instanceof jakarta.persistence.EntityManagerFactory emf && emf.isOpen()) {
                try (jakarta.persistence.EntityManager em = emf.createEntityManager()) {
                    em.createNativeQuery("SELECT 1").getSingleResult();
                    dbConnected = true;
                } catch (Exception ignored) {
                    // DB not reachable
                }
            }
            healthData.put("database", dbConnected ? "CONNECTED" : "DISCONNECTED");
            if (dbConnected) {
                healthData.put("status", "READY");
                ok(resp, healthData);
            } else {
                healthData.put("status", "NOT_READY");
                resp.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
                resp.setContentType("application/json; charset=UTF-8");
                objectMapper.writeValue(resp.getOutputStream(), healthData);
            }
        } else {
            healthData.put("status", "UP");
            ok(resp, healthData);
        }
    }
}
