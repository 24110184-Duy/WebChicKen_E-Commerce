package com.example.webchicken.web.filter;

import com.example.webchicken.common.model.ApiError;
import com.example.webchicken.common.model.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Set;

/**
 * Filter 8/9 — CsrfGuardFilter (ARCHITECTURE.md 1.6)
 * <p>
 * Bảo vệ chống tấn công CSRF cho các yêu cầu thay đổi trạng thái (POST, PUT, DELETE, PATCH)
 * dựa trên kiểm tra tính hợp lệ của Header Origin / Referer đối với các endpoint dùng Cookie.
 * </p>
 */
public class CsrfGuardFilter implements Filter {

    private static final Set<String> MUTATION_METHODS = Set.of("POST", "PUT", "PATCH", "DELETE");
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        if (!(req instanceof HttpServletRequest httpReq) || !(res instanceof HttpServletResponse httpRes)) {
            chain.doFilter(req, res);
            return;
        }

        String method = httpReq.getMethod();
        String path = httpReq.getRequestURI();

        // Chỉ áp dụng với endpoint dùng Cookie như refresh-token
        if (MUTATION_METHODS.contains(method.toUpperCase()) && path.contains("/auth/refresh-token")) {
            String origin = httpReq.getHeader("Origin");
            String referer = httpReq.getHeader("Referer");

            if (origin == null && referer == null) {
                httpRes.setStatus(HttpServletResponse.SC_FORBIDDEN);
                httpRes.setContentType("application/json; charset=UTF-8");
                ApiResponse<Void> body = ApiResponse.fail(
                        ApiError.of("CSRF_VIOLATION", "Yêu cầu bị từ chối do thiếu thông tin Origin/Referer bảo vệ CSRF.")
                );
                objectMapper.writeValue(httpRes.getOutputStream(), body);
                return;
            }
        }

        chain.doFilter(req, res);
    }
}

