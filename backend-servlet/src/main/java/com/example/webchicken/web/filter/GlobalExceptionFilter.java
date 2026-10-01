package com.example.webchicken.web.filter;

import com.example.webchicken.common.exception.AppException;
import com.example.webchicken.common.model.ApiError;
import com.example.webchicken.common.model.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;

/**
 * Filter 2/9 — GlobalExceptionFilter
 * <p>
 * Bắt toàn bộ exception phát sinh từ Controller/Service/DAO:
 * <ul>
 *   <li>Ánh xạ {@link AppException} sang HTTP status và mã lỗi tương ứng.</li>
 *   <li>Ngoại lệ không mong muốn trả HTTP 500 {@code INTERNAL_SERVER_ERROR}, tuyệt đối không lộ stack trace.</li>
 *   <li>Trả về cấu trúc JSON chuẩn {@link ApiResponse}.</li>
 * </ul>
 * </p>
 */
public class GlobalExceptionFilter implements Filter {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionFilter.class);
    private final ObjectMapper objectMapper;

    public GlobalExceptionFilter() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        try {
            chain.doFilter(req, res);
        } catch (Throwable ex) {
            handleException(req, res, ex);
        }
    }

    private void handleException(ServletRequest req, ServletResponse res, Throwable ex) throws IOException {
        if (!(res instanceof HttpServletResponse httpRes)) {
            return;
        }

        int statusCode;
        ApiError apiError;

        // Nếu là lỗi nghiệp vụ đã được định nghĩa
        if (ex instanceof AppException appEx) {
            statusCode = appEx.getHttpStatus();
            apiError = ApiError.of(appEx.getErrorCode(), appEx.getMessage());
            log.warn("Nghiệp vụ trả lỗi [{}]: {}", appEx.getErrorCode(), appEx.getMessage());
        } else if (ex.getCause() instanceof AppException appExCause) {
            statusCode = appExCause.getHttpStatus();
            apiError = ApiError.of(appExCause.getErrorCode(), appExCause.getMessage());
            log.warn("Nghiệp vụ trả lỗi [{}]: {}", appExCause.getErrorCode(), appExCause.getMessage());
        } else {
            // Lỗi hệ thống bất ngờ (500)
            statusCode = HttpServletResponse.SC_INTERNAL_SERVER_ERROR;
            apiError = ApiError.of("INTERNAL_SERVER_ERROR", "Đã có lỗi xảy ra trên hệ thống, vui lòng thử lại sau.");
            log.error("Lỗi hệ thống chưa được kiểm soát: {}", ex.getMessage(), ex);
        }

        if (!httpRes.isCommitted()) {
            httpRes.setStatus(statusCode);
            httpRes.setContentType("application/json; charset=UTF-8");
            ApiResponse<Void> responseBody = ApiResponse.fail(apiError);
            objectMapper.writeValue(httpRes.getOutputStream(), responseBody);
        }
    }
}

