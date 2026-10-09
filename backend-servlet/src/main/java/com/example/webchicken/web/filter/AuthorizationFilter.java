package com.example.webchicken.web.filter;

import com.example.webchicken.common.model.ApiError;
import com.example.webchicken.common.model.ApiResponse;
import com.example.webchicken.common.model.AuthenticatedUser;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

/**
 * Filter 9/9 — AuthorizationFilter (ARCHITECTURE.md 1.6)
 * <p>
 * Kiểm tra phân quyền truy cập theo vai trò (RBAC):
 * <ul>
 *   <li>Đường dẫn {@code /api/v1/admin/*}: Chỉ cho phép {@code SUPER_ADMIN}, {@code MODERATOR}, {@code ADMIN}.</li>
 *   <li>Đường dẫn {@code /api/v1/seller/*}: Chỉ cho phép {@code SELLER} hoặc Admin.</li>
 *   <li>Nếu không đủ quyền, trả HTTP 403 Forbidden.</li>
 * </ul>
 * </p>
 */
public class AuthorizationFilter implements Filter {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        if (!(req instanceof HttpServletRequest httpReq) || !(res instanceof HttpServletResponse httpRes)) {
            chain.doFilter(req, res);
            return;
        }

        String uri = httpReq.getRequestURI();
        String contextPath = httpReq.getContextPath();
        String path = (contextPath != null && !contextPath.isEmpty() && uri.startsWith(contextPath))
                ? uri.substring(contextPath.length())
                : uri;
        AuthenticatedUser user = (AuthenticatedUser) httpReq.getAttribute(AuthenticationFilter.CURRENT_USER_ATTR);

        // 1. Kiểm tra quyền Admin
        if (path.startsWith("/api/v1/admin")) {
            if (user == null || !user.isAdmin()) {
                sendForbidden(httpRes, "Bạn không có quyền quản trị để truy cập chức năng này.");
                return;
            }
        }

        // 2. Kiểm tra quyền Seller
        if (path.startsWith("/api/v1/seller")) {
            if (user == null || (!user.isSeller() && !user.isAdmin())) {
                sendForbidden(httpRes, "Chỉ tài khoản Người bán mới có quyền truy cập khu vực này.");
                return;
            }
        }

        chain.doFilter(req, res);
    }

    private void sendForbidden(HttpServletResponse resp, String message) throws IOException {
        resp.setStatus(HttpServletResponse.SC_FORBIDDEN);
        resp.setContentType("application/json; charset=UTF-8");
        ApiResponse<Void> body = ApiResponse.fail(ApiError.of("FORBIDDEN", message));
        objectMapper.writeValue(resp.getOutputStream(), body);
    }
}

