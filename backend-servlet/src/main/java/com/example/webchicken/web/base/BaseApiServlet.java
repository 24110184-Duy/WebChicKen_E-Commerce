package com.example.webchicken.web.base;

import com.example.webchicken.common.model.ApiError;
import com.example.webchicken.common.model.ApiResponse;
import com.example.webchicken.common.model.AuthenticatedUser;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

/**
 * Lớp cơ sở (Base Class) cho toàn bộ Servlet API trong hệ thống:
 * <ul>
 *   <li>Cung cấp bộ tuần tự hóa/giải tuần tự hóa JSON {@link ObjectMapper}.</li>
 *   <li>Hỗ trợ lấy đối tượng Service từ {@link jakarta.servlet.ServletContext}.</li>
 *   <li>Các phương thức tiện ích đọc request body: {@link #readBody(HttpServletRequest, Class)}.</li>
 *   <li>Các phương thức tiện ích trả phản hồi HTTP chuẩn: {@link #ok}, {@link #created}, {@link #badRequest},...</li>
 * </ul>
 */
public abstract class BaseApiServlet extends HttpServlet {

    protected final ObjectMapper objectMapper;

    protected BaseApiServlet() {
        this.objectMapper = createDefaultObjectMapper();
    }

    protected BaseApiServlet(ObjectMapper objectMapper) {
        this.objectMapper = (objectMapper != null) ? objectMapper : createDefaultObjectMapper();
    }

    private static ObjectMapper createDefaultObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        return mapper;
    }

    /**
     * Đọc JSON từ Request Body chuyển đổi thành đối tượng DTO.
     */
    protected <T> T readBody(HttpServletRequest req, Class<T> clazz) throws IOException {
        return objectMapper.readValue(req.getInputStream(), clazz);
    }

    /**
     * Lấy Service bean đã được đăng ký bởi CompositionRoot trong ServletContext.
     */
    @SuppressWarnings("unchecked")
    protected <T> T getService(String attributeName) {
        Object service = getServletContext().getAttribute(attributeName);
        if (service == null) {
            throw new IllegalStateException("Service [" + attributeName + "] chưa được khởi tạo trong ServletContext.");
        }
        return (T) service;
    }

    protected AuthenticatedUser getAuthenticatedUser(HttpServletRequest req) {
        return (AuthenticatedUser) req.getAttribute("CURRENT_USER");
    }

    // ── Response Helpers ───────────────────────────────────────────────────────

    protected void writeJson(HttpServletResponse resp, int status, Object body) throws IOException {
        resp.setStatus(status);
        resp.setContentType("application/json; charset=UTF-8");
        objectMapper.writeValue(resp.getOutputStream(), body);
    }

    protected <T> void ok(HttpServletResponse resp, T data) throws IOException {
        writeJson(resp, HttpServletResponse.SC_OK, ApiResponse.ok(data));
    }

    protected <T> void created(HttpServletResponse resp, T data) throws IOException {
        writeJson(resp, HttpServletResponse.SC_CREATED, ApiResponse.ok(data));
    }

    protected void noContent(HttpServletResponse resp) {
        resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
    }

    protected void badRequest(HttpServletResponse resp, String errorCode, String message) throws IOException {
        writeJson(resp, HttpServletResponse.SC_BAD_REQUEST, ApiResponse.fail(ApiError.of(errorCode, message)));
    }

    protected void unauthorized(HttpServletResponse resp, String message) throws IOException {
        writeJson(resp, HttpServletResponse.SC_UNAUTHORIZED, ApiResponse.fail(ApiError.of("UNAUTHORIZED", message)));
    }

    protected void forbidden(HttpServletResponse resp, String message) throws IOException {
        writeJson(resp, HttpServletResponse.SC_FORBIDDEN, ApiResponse.fail(ApiError.of("FORBIDDEN", message)));
    }

    protected void notFound(HttpServletResponse resp, String message) throws IOException {
        writeJson(resp, HttpServletResponse.SC_NOT_FOUND, ApiResponse.fail(ApiError.of("NOT_FOUND", message)));
    }

    // ── Parameter Helpers ──────────────────────────────────────────────────────

    protected int getIntParam(HttpServletRequest req, String name, int defaultValue) {
        String val = req.getParameter(name);
        if (val == null || val.isBlank()) return defaultValue;
        try {
            return Integer.parseInt(val.trim());
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    protected long getLongParam(HttpServletRequest req, String name, long defaultValue) {
        String val = req.getParameter(name);
        if (val == null || val.isBlank()) return defaultValue;
        try {
            return Long.parseLong(val.trim());
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    protected String getStringParam(HttpServletRequest req, String name, String defaultValue) {
        String val = req.getParameter(name);
        return (val != null && !val.isBlank()) ? val.trim() : defaultValue;
    }
}

