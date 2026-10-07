package com.example.webchicken.modules.inventory.controller;

import com.example.webchicken.modules.inventory.worker.ExpiredReservationWorker;
import com.example.webchicken.web.base.BaseApiServlet;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Map;

/**
 * Controller for triggering and monitoring background jobs (TASK-55).
 * URL: /api/v1/jobs/*
 */
@WebServlet(name = "JobServlet", urlPatterns = {"/api/v1/jobs", "/api/v1/jobs/*"})
public class JobServlet extends BaseApiServlet {

    public JobServlet() {
        super();
    }

    public JobServlet(ObjectMapper objectMapper) {
        super(objectMapper);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        if (pathInfo != null && pathInfo.endsWith("/cleanup-reservations")) {
            ExpiredReservationWorker worker = (ExpiredReservationWorker) getServletContext().getAttribute("expiredReservationWorker");
            if (worker == null) {
                badRequest(resp, "SERVICE_UNAVAILABLE", "ExpiredReservationWorker is not initialized");
                return;
            }

            int cleanedCount = worker.runCleanup();
            ok(resp, Map.of(
                    "cleanedCount", cleanedCount,
                    "message", "Expired reservations cleanup executed successfully"
            ));
        } else if (pathInfo != null && pathInfo.endsWith("/simulate-shipping")) {
            com.example.webchicken.modules.order.worker.ShippingSimulationWorker worker =
                    (com.example.webchicken.modules.order.worker.ShippingSimulationWorker) getServletContext().getAttribute("shippingSimulationWorker");
            if (worker == null) {
                badRequest(resp, "SERVICE_UNAVAILABLE", "ShippingSimulationWorker is not initialized");
                return;
            }

            boolean forceAll = "true".equalsIgnoreCase(req.getParameter("forceAll"));
            long delaySeconds = worker.getDefaultDelaySeconds();
            String delayParam = req.getParameter("delaySeconds");
            if (delayParam != null && !delayParam.isBlank()) {
                try {
                    delaySeconds = Long.parseLong(delayParam.trim());
                } catch (NumberFormatException ignored) {}
            }

            int deliveredCount = worker.runSimulation(delaySeconds, forceAll);
            ok(resp, Map.of(
                    "deliveredCount", deliveredCount,
                    "forceAll", forceAll,
                    "delaySeconds", delaySeconds,
                    "message", "Shipping simulation job executed successfully"
            ));
        } else if (pathInfo != null && (pathInfo.endsWith("/deactivate-expired-vouchers") || pathInfo.endsWith("/expire-vouchers"))) {
            com.example.webchicken.modules.promotion.worker.VoucherExpiryWorker worker =
                    (com.example.webchicken.modules.promotion.worker.VoucherExpiryWorker) getServletContext().getAttribute("voucherExpiryWorker");
            if (worker == null) {
                badRequest(resp, "SERVICE_UNAVAILABLE", "VoucherExpiryWorker is not initialized");
                return;
            }

            boolean includeUsageLimit = !"false".equalsIgnoreCase(req.getParameter("includeUsageLimit"));
            int deactivatedCount = worker.runScanAndDeactivate(includeUsageLimit);
            ok(resp, Map.of(
                    "deactivatedCount", deactivatedCount,
                    "includeUsageLimit", includeUsageLimit,
                    "scannedAt", java.time.LocalDateTime.now().toString(),
                    "message", "Expired vouchers scan and deactivation executed successfully"
            ));
        } else {
            badRequest(resp, "INVALID_ENDPOINT", "Supported endpoints: POST /api/v1/jobs/cleanup-reservations, POST /api/v1/jobs/simulate-shipping, POST /api/v1/jobs/deactivate-expired-vouchers");
        }
    }
}
