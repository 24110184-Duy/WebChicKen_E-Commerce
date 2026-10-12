package com.example.webchicken.modules.catalog.controller;

import com.example.webchicken.common.exception.AppException;
import com.example.webchicken.common.exception.NotFoundException;
import com.example.webchicken.common.model.AuthenticatedUser;
import com.example.webchicken.common.model.PageResult;
import com.example.webchicken.modules.catalog.model.dto.request.CreateProductRequest;
import com.example.webchicken.modules.catalog.model.dto.request.ProductFilterCriteria;
import com.example.webchicken.modules.catalog.model.dto.request.UpdateProductRequest;
import com.example.webchicken.modules.catalog.model.dto.response.ProductDetailResponse;
import com.example.webchicken.modules.catalog.model.dto.response.ProductSummaryResponse;
import com.example.webchicken.modules.catalog.model.enums.ProductStatus;
import com.example.webchicken.modules.catalog.service.ProductService;
import com.example.webchicken.web.base.BaseApiServlet;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * Controller xử lý tìm kiếm, chi tiết và CRUD sản phẩm (SPU/SKU).
 * URL Pattern: /api/v1/products, /api/v1/products/*
 */
@WebServlet(name = "ProductServlet", urlPatterns = {"/api/v1/products", "/api/v1/products/*", "/api/v1/admin/products", "/api/v1/admin/products/*"})
public class ProductServlet extends BaseApiServlet {

    public ProductServlet() {
        super();
    }

    public ProductServlet(ObjectMapper objectMapper) {
        super(objectMapper);
    }

    private ProductService service() {
        return getService("productService");
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        try {
            AuthenticatedUser user = getAuthenticatedUser(req);
            boolean isAdmin = user != null && user.isAdmin();

            // GET /api/v1/products/{id} -> Single Product Detail
            if (pathInfo != null && pathInfo.length() > 1) {
                String id = pathInfo.substring(1);
                ProductDetailResponse detail = service().getProductDetail(id);
                // Nếu sản phẩm chưa ACTIVE, chỉ Admin hoặc chính gian hàng sở hữu mới được xem
                if (detail.status() != ProductStatus.ACTIVE && !isAdmin) {
                    boolean isOwner = user != null && detail.storeId() != null && detail.storeId().equals(user.userId());
                    if (!isOwner) {
                        throw new NotFoundException("Sản phẩm không tồn tại hoặc chưa được kích hoạt mở bán");
                    }
                }
                ok(resp, detail);
                return;
            }

            // GET /api/v1/products -> Search/List Products with Filters
            String q = getStringParam(req, "q", null);
            String categoryId = getStringParam(req, "categoryId", null);
            String storeId = getStringParam(req, "storeId", null);
            Long minPrice = req.getParameter("minPrice") != null ? getLongParam(req, "minPrice", 0) : null;
            Long maxPrice = req.getParameter("maxPrice") != null ? getLongParam(req, "maxPrice", Long.MAX_VALUE) : null;
            String statusParam = getStringParam(req, "status", null);

            String servletPath = req.getServletPath();
            String requestUri = req.getRequestURI();
            boolean isAdminPath = (servletPath != null && servletPath.contains("/admin/"))
                    || (requestUri != null && requestUri.contains("/admin/"));
            boolean hasExplicitStatus = statusParam != null && !statusParam.isBlank();

            ProductStatus status = null;
            if (isAdmin && (isAdminPath || hasExplicitStatus)) {
                if (!"ALL".equalsIgnoreCase(statusParam) && statusParam != null) {
                    try {
                        status = ProductStatus.valueOf(statusParam.toUpperCase());
                    } catch (IllegalArgumentException ignored) {}
                }
            } else {
                // Khách mua, công chúng và storefront mặc định CHỈ xem các sản phẩm ACTIVE (đang mở bán)
                status = ProductStatus.ACTIVE;
            }

            String sort = getStringParam(req, "sort", "newest");
            int page = getIntParam(req, "page", 0);
            if (page > 0) page = page - 1; // Convert 1-indexed from client to 0-indexed
            int size = getIntParam(req, "size", 20);

            ProductFilterCriteria filter = new ProductFilterCriteria(
                    q, categoryId, storeId, minPrice, maxPrice, status, sort, page, size
            );

            PageResult<ProductSummaryResponse> result = service().searchProducts(filter);
            ok(resp, result);

        } catch (AppException e) {
            writeJson(resp, e.getHttpStatus(), com.example.webchicken.common.model.ApiResponse.fail(
                    com.example.webchicken.common.model.ApiError.of(e.getErrorCode(), e.getMessage())));
        } catch (Exception e) {
            badRequest(resp, "INTERNAL_ERROR", e.getMessage());
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            CreateProductRequest body = readBody(req, CreateProductRequest.class);
            ProductDetailResponse created = service().createProduct(body);
            created(resp, created);
        } catch (AppException e) {
            writeJson(resp, e.getHttpStatus(), com.example.webchicken.common.model.ApiResponse.fail(
                    com.example.webchicken.common.model.ApiError.of(e.getErrorCode(), e.getMessage())));
        } catch (IllegalArgumentException e) {
            badRequest(resp, "VALIDATION_ERROR", e.getMessage());
        } catch (Exception e) {
            badRequest(resp, "BAD_REQUEST", e.getMessage());
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        if (pathInfo == null || pathInfo.length() <= 1) {
            badRequest(resp, "MISSING_ID", "Product ID is required in URL path");
            return;
        }

        // Xử lý kiểm duyệt sản phẩm cho Admin: PUT /{id}/review hoặc PUT /{id}/moderation
        if (pathInfo.contains("/review") || pathInfo.contains("/moderation")) {
            com.example.webchicken.common.model.AuthenticatedUser user = getAuthenticatedUser(req);
            if (user == null || !user.isAdmin()) {
                forbidden(resp, "Chỉ Quản trị viên mới có quyền kiểm duyệt sản phẩm.");
                return;
            }

            String clean = pathInfo.replaceAll("/+$", "");
            String productId = clean.startsWith("/") ? clean.substring(1) : clean;
            if (productId.endsWith("/review")) {
                productId = productId.substring(0, productId.length() - "/review".length());
            } else if (productId.endsWith("/moderation")) {
                productId = productId.substring(0, productId.length() - "/moderation".length());
            }
            if (productId.contains("/")) {
                String[] segments = productId.split("/");
                productId = segments[segments.length - 1];
            }
            productId = productId.trim();

            if (!productId.isBlank()) {
                try {
                    com.example.webchicken.modules.catalog.model.dto.request.ReviewProductRequest body =
                            readBody(req, com.example.webchicken.modules.catalog.model.dto.request.ReviewProductRequest.class);

                    if (body == null || body.status() == null || body.status().isBlank()) {
                        badRequest(resp, "VALIDATION_ERROR", "Trạng thái kiểm duyệt không được để trống.");
                        return;
                    }

                    String rawStatus = body.status().trim().toUpperCase();
                    if ("REJECTED".equals(rawStatus) || "REJECT".equals(rawStatus)) {
                        rawStatus = "INACTIVE";
                    } else if ("APPROVE".equals(rawStatus) || "APPROVED".equals(rawStatus)) {
                        rawStatus = "ACTIVE";
                    }

                    ProductStatus targetStatus;
                    try {
                        targetStatus = ProductStatus.valueOf(rawStatus);
                    } catch (IllegalArgumentException e) {
                        badRequest(resp, "VALIDATION_ERROR", "Trạng thái không hợp lệ (hỗ trợ ACTIVE, INACTIVE, PENDING_APPROVAL).");
                        return;
                    }

                    String adminName = (user.email() != null && !user.email().isBlank()) ? user.email() : user.userId();
                    ProductDetailResponse reviewed = service().reviewProduct(
                            productId,
                            targetStatus,
                            body.rejectionReason(),
                            "ADMIN: " + adminName,
                            body.moderationNote()
                    );

                    try {
                        com.example.webchicken.modules.backoffice.service.AuditLogService auditService = getService("auditLogService");
                        if (auditService != null) {
                            String act = (targetStatus == ProductStatus.ACTIVE) ? "APPROVE_PRODUCT" : "REJECT_PRODUCT";
                            String detail = (targetStatus == ProductStatus.ACTIVE)
                                    ? "Duyệt mở bán sản phẩm: " + reviewed.name()
                                    : "Từ chối sản phẩm (" + reviewed.name() + "). Lý do: " + body.rejectionReason();
                            auditService.log(user.userId(), act, "PRODUCT", productId, detail, req.getRemoteAddr());
                        }
                    } catch (Exception ignored) {}

                    ok(resp, reviewed);
                    return;
                } catch (AppException e) {
                    writeJson(resp, e.getHttpStatus(), com.example.webchicken.common.model.ApiResponse.fail(
                            com.example.webchicken.common.model.ApiError.of(e.getErrorCode(), e.getMessage())));
                    return;
                } catch (Exception e) {
                    badRequest(resp, "BAD_REQUEST", e.getMessage());
                    return;
                }
            }
        }

        String id = pathInfo.substring(1);
        try {
            UpdateProductRequest body = readBody(req, UpdateProductRequest.class);
            ProductDetailResponse updated = service().updateProduct(id, body);
            ok(resp, updated);
        } catch (AppException e) {
            writeJson(resp, e.getHttpStatus(), com.example.webchicken.common.model.ApiResponse.fail(
                    com.example.webchicken.common.model.ApiError.of(e.getErrorCode(), e.getMessage())));
        } catch (Exception e) {
            badRequest(resp, "BAD_REQUEST", e.getMessage());
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        if (pathInfo == null || pathInfo.length() <= 1) {
            badRequest(resp, "MISSING_ID", "Product ID is required in URL path");
            return;
        }

        AuthenticatedUser user = getAuthenticatedUser(req);
        if (user == null || !user.isAdmin()) {
            forbidden(resp, "Chỉ Quản trị viên mới có quyền gỡ bỏ sản phẩm khỏi hệ thống sàn.");
            return;
        }

        String id = pathInfo.replaceFirst("^/", "").trim();
        if (id.contains("/")) {
            String[] segments = id.split("/");
            id = segments[segments.length - 1];
        }

        try {
            service().deleteProduct(id);
            noContent(resp);
        } catch (AppException e) {
            writeJson(resp, e.getHttpStatus(), com.example.webchicken.common.model.ApiResponse.fail(
                    com.example.webchicken.common.model.ApiError.of(e.getErrorCode(), e.getMessage())));
        } catch (Exception e) {
            badRequest(resp, "BAD_REQUEST", e.getMessage());
        }
    }
}
