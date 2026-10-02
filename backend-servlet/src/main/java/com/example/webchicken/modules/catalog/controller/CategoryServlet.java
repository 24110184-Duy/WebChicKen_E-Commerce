package com.example.webchicken.modules.catalog.controller;

import com.example.webchicken.common.exception.AppException;
import com.example.webchicken.modules.catalog.model.dto.request.CreateCategoryRequest;
import com.example.webchicken.modules.catalog.model.dto.request.UpdateCategoryRequest;
import com.example.webchicken.modules.catalog.model.dto.response.CategoryResponse;
import com.example.webchicken.modules.catalog.service.CategoryService;
import com.example.webchicken.web.base.BaseApiServlet;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;

/**
 * Controller xử lý các yêu cầu liên quan đến danh mục sản phẩm (Category).
 * URL Pattern: /api/v1/categories, /api/v1/categories/*
 */
@WebServlet(name = "CategoryServlet", urlPatterns = {"/api/v1/categories", "/api/v1/categories/*"})
public class CategoryServlet extends BaseApiServlet {

    public CategoryServlet() {
        super();
    }

    public CategoryServlet(ObjectMapper objectMapper) {
        super(objectMapper);
    }

    private CategoryService service() {
        return getService("categoryService");
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        try {
            if (pathInfo == null || pathInfo.equals("/") || pathInfo.isEmpty()) {
                List<CategoryResponse> list = service().getAllCategories();
                ok(resp, list);
            } else {
                String id = pathInfo.substring(1);
                CategoryResponse category = service().getCategoryById(id);
                ok(resp, category);
            }
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
            CreateCategoryRequest body = readBody(req, CreateCategoryRequest.class);
            CategoryResponse createdCategory = service().createCategory(body);
            created(resp, createdCategory);
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
            badRequest(resp, "MISSING_ID", "Category ID is required in URL path");
            return;
        }
        String id = pathInfo.substring(1);
        try {
            UpdateCategoryRequest body = readBody(req, UpdateCategoryRequest.class);
            CategoryResponse updated = service().updateCategory(id, body);
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
            badRequest(resp, "MISSING_ID", "Category ID is required in URL path");
            return;
        }
        String id = pathInfo.substring(1);
        try {
            service().deleteCategory(id);
            noContent(resp);
        } catch (AppException e) {
            writeJson(resp, e.getHttpStatus(), com.example.webchicken.common.model.ApiResponse.fail(
                    com.example.webchicken.common.model.ApiError.of(e.getErrorCode(), e.getMessage())));
        } catch (Exception e) {
            badRequest(resp, "BAD_REQUEST", e.getMessage());
        }
    }
}
