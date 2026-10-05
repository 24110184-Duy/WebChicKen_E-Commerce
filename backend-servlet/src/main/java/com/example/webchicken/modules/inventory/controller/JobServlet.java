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
        } else {
            badRequest(resp, "INVALID_ENDPOINT", "Supported endpoints: POST /api/v1/jobs/cleanup-reservations");
        }
    }
}
