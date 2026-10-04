package com.example.webchicken.modules.promotion.controller;

import com.example.webchicken.common.exception.AppException;
import com.example.webchicken.common.model.ApiResponse;
import com.example.webchicken.modules.promotion.model.dto.request.ValidateVoucherRequest;
import com.example.webchicken.modules.promotion.model.dto.response.ValidateVoucherResponse;
import com.example.webchicken.modules.promotion.model.dto.response.VoucherResponse;
import com.example.webchicken.modules.promotion.service.VoucherService;
import com.example.webchicken.web.base.BaseApiServlet;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;

/**
 * RESTful Controller quản lý và xác thực Voucher khuyến mãi (TASK-43).
 * URL Patterns: /api/v1/vouchers, /api/v1/vouchers/*
 */
@WebServlet(name = "VoucherServlet", urlPatterns = {"/api/v1/vouchers", "/api/v1/vouchers/*"})
public class VoucherServlet extends BaseApiServlet {

    public VoucherServlet() {
        super();
    }

    public VoucherServlet(ObjectMapper objectMapper) {
        super(objectMapper);
    }

    private VoucherService voucherService() {
        return getService("voucherService");
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        try {
            if (pathInfo == null || pathInfo.equals("/")) {
                String storeId = req.getParameter("storeId");
                String orderValStr = req.getParameter("orderValue");
                long orderValueMinor = 0;
                if (orderValStr != null && !orderValStr.isBlank()) {
                    try {
                        orderValueMinor = Long.parseLong(orderValStr);
                    } catch (NumberFormatException ignored) {}
                }

                List<VoucherResponse> vouchers = voucherService().getAvailableVouchers(storeId, orderValueMinor);
                ok(resp, vouchers);
            } else {
                String code = pathInfo.replaceFirst("/", "");
                VoucherResponse voucher = voucherService().getVoucherByCode(code);
                ok(resp, voucher);
            }
        } catch (AppException e) {
            writeJson(resp, e.getHttpStatus(), ApiResponse.fail(com.example.webchicken.common.model.ApiError.of(e.getErrorCode(), e.getMessage())));
        } catch (Exception e) {
            badRequest(resp, "INTERNAL_ERROR", e.getMessage());
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        try {
            if (pathInfo != null && pathInfo.equals("/validate")) {
                ValidateVoucherRequest body = readBody(req, ValidateVoucherRequest.class);
                ValidateVoucherResponse result = voucherService().validateVoucher(body);
                ok(resp, result);
            } else {
                badRequest(resp, "INVALID_ENDPOINT", "Use POST /api/v1/vouchers/validate");
            }
        } catch (AppException e) {
            writeJson(resp, e.getHttpStatus(), ApiResponse.fail(com.example.webchicken.common.model.ApiError.of(e.getErrorCode(), e.getMessage())));
        } catch (Exception e) {
            badRequest(resp, "BAD_REQUEST", e.getMessage());
        }
    }
}
