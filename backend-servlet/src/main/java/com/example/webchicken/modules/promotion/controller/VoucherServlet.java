package com.example.webchicken.modules.promotion.controller;

import com.example.webchicken.common.exception.AppException;
import com.example.webchicken.common.model.ApiResponse;
import com.example.webchicken.common.model.AuthenticatedUser;
import com.example.webchicken.modules.promotion.model.dto.request.CreateVoucherRequest;
import com.example.webchicken.modules.promotion.model.dto.request.ValidateVoucherRequest;
import com.example.webchicken.modules.promotion.model.dto.response.ValidateVoucherResponse;
import com.example.webchicken.modules.promotion.model.dto.response.VoucherResponse;
import com.example.webchicken.modules.promotion.service.VoucherService;
import com.example.webchicken.web.base.BaseApiServlet;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * RESTful Controller quản lý và xác thực Voucher khuyến mãi (TASK-43, TASK-70).
 * Hỗ trợ tạo voucher cho Toàn sàn (Admin) hoặc Theo Gian hàng / Theo Danh mục (Admin & Seller).
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
    protected void service(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if ("PATCH".equalsIgnoreCase(req.getMethod())) {
            doPatch(req, resp);
        } else {
            super.service(req, resp);
        }
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        try {
            if (pathInfo == null || pathInfo.equals("/")) {
                String allParam = req.getParameter("all");
                String storeId = req.getParameter("storeId");

                // Nếu có cờ all=true: Lấy toàn bộ danh sách voucher phục vụ trang Quản trị (Admin / Seller)
                if ("true".equalsIgnoreCase(allParam)) {
                    int page = 1;
                    int size = 100;
                    try {
                        String pageStr = req.getParameter("page");
                        if (pageStr != null && !pageStr.isBlank()) page = Integer.parseInt(pageStr);
                        String sizeStr = req.getParameter("size");
                        if (sizeStr != null && !sizeStr.isBlank()) size = Integer.parseInt(sizeStr);
                    } catch (NumberFormatException ignored) {}

                    List<VoucherResponse> vouchers = voucherService().getAllVouchers(storeId, null, page, size);
                    ok(resp, vouchers);
                    return;
                }

                // Mặc định: Lấy danh sách voucher đang hiệu lực cho người mua
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
            if (pathInfo == null || pathInfo.equals("/")) {
                // Tạo mới voucher (yêu cầu ADMIN hoặc SELLER)
                AuthenticatedUser user = getAuthenticatedUser(req);
                CreateVoucherRequest body = readBody(req, CreateVoucherRequest.class);
                VoucherResponse created = voucherService().createVoucher(body, user);
                created(resp, created);
            } else if (pathInfo.equals("/validate")) {
                // Kiểm tra tính hợp lệ của voucher
                ValidateVoucherRequest body = readBody(req, ValidateVoucherRequest.class);
                ValidateVoucherResponse result = voucherService().validateVoucher(body);
                ok(resp, result);
            } else if (pathInfo.matches("/.+/toggle")) {
                // Bật/tắt trạng thái voucher
                String id = pathInfo.replaceFirst("/", "").replace("/toggle", "");
                VoucherResponse result = voucherService().toggleVoucherStatus(id, getAuthenticatedUser(req));
                ok(resp, result);
            } else {
                badRequest(resp, "INVALID_ENDPOINT", "Endpoint không hợp lệ.");
            }
        } catch (AppException e) {
            writeJson(resp, e.getHttpStatus(), ApiResponse.fail(com.example.webchicken.common.model.ApiError.of(e.getErrorCode(), e.getMessage())));
        } catch (Exception e) {
            badRequest(resp, "BAD_REQUEST", e.getMessage());
        }
    }

    protected void doPatch(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        try {
            if (pathInfo != null && pathInfo.matches("/.+/toggle")) {
                String id = pathInfo.replaceFirst("/", "").replace("/toggle", "");
                VoucherResponse result = voucherService().toggleVoucherStatus(id, getAuthenticatedUser(req));
                ok(resp, result);
            } else {
                badRequest(resp, "INVALID_ENDPOINT", "Sử dụng PATCH /api/v1/vouchers/{id}/toggle");
            }
        } catch (AppException e) {
            writeJson(resp, e.getHttpStatus(), ApiResponse.fail(com.example.webchicken.common.model.ApiError.of(e.getErrorCode(), e.getMessage())));
        } catch (Exception e) {
            badRequest(resp, "BAD_REQUEST", e.getMessage());
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        try {
            if (pathInfo != null && !pathInfo.equals("/")) {
                String id = pathInfo.replaceFirst("/", "");
                voucherService().deleteVoucher(id, getAuthenticatedUser(req));
                ok(resp, Map.of("message", "Đã xóa voucher thành công."));
            } else {
                badRequest(resp, "MISSING_ID", "Vui lòng cung cấp mã ID của voucher để xóa.");
            }
        } catch (AppException e) {
            writeJson(resp, e.getHttpStatus(), ApiResponse.fail(com.example.webchicken.common.model.ApiError.of(e.getErrorCode(), e.getMessage())));
        } catch (Exception e) {
            badRequest(resp, "BAD_REQUEST", e.getMessage());
        }
    }
}
