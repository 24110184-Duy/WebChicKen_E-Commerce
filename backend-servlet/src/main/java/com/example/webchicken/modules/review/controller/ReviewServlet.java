package com.example.webchicken.modules.review.controller;

import com.example.webchicken.common.exception.AppException;
import com.example.webchicken.common.model.ApiError;
import com.example.webchicken.common.model.ApiResponse;
import com.example.webchicken.common.model.AuthenticatedUser;
import com.example.webchicken.modules.review.model.dto.request.CreateReviewRequest;
import com.example.webchicken.modules.review.model.dto.request.UpdateReviewRequest;
import com.example.webchicken.modules.review.model.dto.response.ReviewResponse;
import com.example.webchicken.modules.review.model.dto.response.ReviewSummaryResponse;
import com.example.webchicken.modules.review.service.ReviewService;
import com.example.webchicken.web.base.BaseApiServlet;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;

/**
 * RESTful Controller cho đánh giá & phản hồi sản phẩm (TASK-56).
 * URL Patterns: /api/v1/reviews, /api/v1/reviews/*
 */
@WebServlet(name = "ReviewServlet", urlPatterns = {"/api/v1/reviews", "/api/v1/reviews/*"})
public class ReviewServlet extends BaseApiServlet {

    public ReviewServlet() {
        super();
    }

    public ReviewServlet(ObjectMapper objectMapper) {
        super(objectMapper);
    }

    private ReviewService reviewService() {
        return getService("reviewService");
    }

    private String resolveUserId(HttpServletRequest req) {
        AuthenticatedUser user = getAuthenticatedUser(req);
        if (user != null && user.userId() != null) {
            return user.userId();
        }
        String headerCustId = req.getHeader("X-Customer-Id");
        if (headerCustId != null && !headerCustId.isBlank()) {
            return headerCustId;
        }
        String headerUserId = req.getHeader("X-User-Id");
        if (headerUserId != null && !headerUserId.isBlank()) {
            return headerUserId;
        }
        return null;
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        if (pathInfo == null) pathInfo = "";

        try {
            // GET /api/v1/reviews/products/{productId}/summary
            if (pathInfo.startsWith("/products/") && pathInfo.endsWith("/summary")) {
                String productId = pathInfo.substring("/products/".length(), pathInfo.length() - "/summary".length());
                ReviewSummaryResponse summary = reviewService().getProductReviewSummary(productId);
                ok(resp, summary);
                return;
            }

            // GET /api/v1/reviews/products/{productId}
            if (pathInfo.startsWith("/products/")) {
                String productId = pathInfo.substring("/products/".length());
                Integer ratingFilter = null;
                String ratingParam = req.getParameter("rating");
                if (ratingParam != null && !ratingParam.isBlank()) {
                    try { ratingFilter = Integer.parseInt(ratingParam); } catch (NumberFormatException ignored) {}
                }

                int page = getIntParam(req, "page", 1);
                int size = Math.min(100, getIntParam(req, "size", 10));

                List<ReviewResponse> list = reviewService().getProductReviews(productId, ratingFilter, page, size);
                ok(resp, list);
                return;
            }

            // GET /api/v1/reviews/my
            if (pathInfo.equals("/my")) {
                String userId = resolveUserId(req);
                if (userId == null) {
                    unauthorized(resp, "Authentication required to view your reviews.");
                    return;
                }

                int page = getIntParam(req, "page", 1);
                int size = Math.min(100, getIntParam(req, "size", 10));

                List<ReviewResponse> list = reviewService().getMyReviews(userId, page, size);
                ok(resp, list);
                return;
            }

            badRequest(resp, "INVALID_PATH", "Invalid review endpoint path: " + pathInfo);

        } catch (AppException e) {
            writeJson(resp, e.getHttpStatus(), ApiResponse.fail(ApiError.of(e.getErrorCode(), e.getMessage())));
        } catch (Exception e) {
            badRequest(resp, "INTERNAL_ERROR", "An unexpected error occurred: " + e.getMessage());
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        if (pathInfo == null || pathInfo.equals("/") || pathInfo.isEmpty()) {
            // POST /api/v1/reviews
            String userId = resolveUserId(req);
            if (userId == null) {
                unauthorized(resp, "Authentication required to submit a review.");
                return;
            }

            try {
                CreateReviewRequest request = readBody(req, CreateReviewRequest.class);
                ReviewResponse created = reviewService().createReview(userId, request);
                created(resp, created);
            } catch (AppException e) {
                writeJson(resp, e.getHttpStatus(), ApiResponse.fail(ApiError.of(e.getErrorCode(), e.getMessage())));
            } catch (Exception e) {
                badRequest(resp, "INTERNAL_ERROR", "Failed to create review: " + e.getMessage());
            }
            return;
        }

        badRequest(resp, "INVALID_PATH", "Invalid POST path: " + pathInfo);
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        if (pathInfo == null || !pathInfo.startsWith("/")) {
            badRequest(resp, "INVALID_PATH", "Review ID is required in path.");
            return;
        }

        String reviewId = pathInfo.substring(1);
        String userId = resolveUserId(req);
        if (userId == null) {
            unauthorized(resp, "Authentication required to update review.");
            return;
        }

        try {
            UpdateReviewRequest request = readBody(req, UpdateReviewRequest.class);
            ReviewResponse updated = reviewService().updateReview(userId, reviewId, request);
            ok(resp, updated);
        } catch (AppException e) {
            writeJson(resp, e.getHttpStatus(), ApiResponse.fail(ApiError.of(e.getErrorCode(), e.getMessage())));
        } catch (Exception e) {
            badRequest(resp, "INTERNAL_ERROR", "Failed to update review: " + e.getMessage());
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        if (pathInfo == null || !pathInfo.startsWith("/")) {
            badRequest(resp, "INVALID_PATH", "Review ID is required in path.");
            return;
        }

        String reviewId = pathInfo.substring(1);
        String userId = resolveUserId(req);
        if (userId == null) {
            unauthorized(resp, "Authentication required to delete review.");
            return;
        }

        try {
            reviewService().deleteReview(userId, reviewId);
            noContent(resp);
        } catch (AppException e) {
            writeJson(resp, e.getHttpStatus(), ApiResponse.fail(ApiError.of(e.getErrorCode(), e.getMessage())));
        } catch (Exception e) {
            badRequest(resp, "INTERNAL_ERROR", "Failed to delete review: " + e.getMessage());
        }
    }
}
