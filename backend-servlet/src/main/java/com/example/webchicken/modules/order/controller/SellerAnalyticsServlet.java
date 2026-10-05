package com.example.webchicken.modules.order.controller;

import com.example.webchicken.common.exception.AuthorizationException;
import com.example.webchicken.common.model.AuthenticatedUser;
import com.example.webchicken.modules.order.model.dto.response.SellerDashboardStatsResponse;
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

/**
 * Controller for Seller Analytics & Performance Dashboard (TASK-60).
 * URL Patterns:
 * - GET /api/v1/seller/dashboard-stats
 * - GET /api/v1/seller/dashboard-stats/*
 * - GET /api/v1/seller/analytics/*
 */
@WebServlet(name = "SellerAnalyticsServlet", urlPatterns = {
        "/api/v1/seller/dashboard-stats",
        "/api/v1/seller/dashboard-stats/*",
        "/api/v1/seller/analytics/*"
})
public class SellerAnalyticsServlet extends BaseApiServlet {

    private static final Logger log = LoggerFactory.getLogger(SellerAnalyticsServlet.class);

    public SellerAnalyticsServlet() {
        super();
    }

    public SellerAnalyticsServlet(ObjectMapper objectMapper) {
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
            String shopId = resolveShopId(req);
            verifyOwnership(req, shopId);

            String period = getStringParam(req, "period", "7d");
            SellerDashboardStatsResponse stats = orderService().getStoreDashboardStats(shopId, period);

            ok(resp, stats);
        } catch (AuthorizationException e) {
            forbidden(resp, e.getMessage());
        } catch (Exception e) {
            log.error("Error retrieving seller dashboard statistics", e);
            writeJson(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    com.example.webchicken.common.model.ApiResponse.fail(
                            com.example.webchicken.common.model.ApiError.of("SERVER_ERROR", "Failed to load seller analytics: " + e.getMessage())));
        }
    }

    private String resolveShopId(HttpServletRequest req) {
        // Check query parameter
        String paramShopId = getStringParam(req, "shopId", null);
        if (paramShopId != null && !paramShopId.isBlank()) {
            return paramShopId.trim();
        }

        // Check path info: /api/v1/seller/dashboard-stats/{shopId}
        String pathInfo = req.getPathInfo();
        if (pathInfo != null && !pathInfo.isBlank() && !"/".equals(pathInfo)) {
            String[] parts = pathInfo.split("/");
            for (String part : parts) {
                if (!part.isBlank() && !"dashboard-stats".equalsIgnoreCase(part) && !"analytics".equalsIgnoreCase(part)) {
                    return part.trim();
                }
            }
        }

        // Fallback to authenticated user's store
        AuthenticatedUser user = getAuthenticatedUser(req);
        if (user != null) {
            try {
                StoreResponse store = storeService().getStoreBySellerId(user.userId());
                if (store != null) return store.id();
            } catch (Exception ignored) {}
        }

        // Default store fallback for development
        return "store-1";
    }

    private void verifyOwnership(HttpServletRequest req, String shopId) {
        AuthenticatedUser user = getAuthenticatedUser(req);
        if (user == null) {
            // Allow development access if unauthenticated
            return;
        }

        if (user.hasRole("ADMIN") || user.hasRole("SUPER_ADMIN")) {
            return;
        }

        try {
            StoreResponse store = storeService().getStoreById(shopId);
            if (store != null && !user.userId().equals(store.sellerId())) {
                throw new AuthorizationException("You do not have permission to view analytics for this shop");
            }
        } catch (AuthorizationException e) {
            throw e;
        } catch (Exception ignored) {}
    }
}
