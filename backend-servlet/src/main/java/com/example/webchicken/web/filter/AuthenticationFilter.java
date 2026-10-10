package com.example.webchicken.web.filter;

import com.example.webchicken.common.model.ApiError;
import com.example.webchicken.common.model.ApiResponse;
import com.example.webchicken.common.model.AuthenticatedUser;
import com.example.webchicken.infrastructure.security.JwtProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Set;

/**
 * Filter 7/9 — AuthenticationFilter
 * <p>
 * Kiểm tra xác thực qua header {@code Authorization: Bearer <token>}:
 * <ul>
 *   <li>Các endpoint công khai (public) được cho phép đi qua mà không bắt buộc có token.</li>
 *   <li>Nếu có token hợp lệ, gán đối tượng {@link AuthenticatedUser} vào {@code request.setAttribute("CURRENT_USER", user)}.</li>
 *   <li>Nếu endpoint được bảo vệ mà không có token hoặc token sai, phản hồi HTTP 401 Unauthorized.</li>
 * </ul>
 * </p>
 */
public class AuthenticationFilter implements Filter {

    public static final String CURRENT_USER_ATTR = "CURRENT_USER";
    private static final String AUTH_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtProvider jwtProvider = new JwtProvider();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Các endpoint công khai không bắt buộc đăng nhập
    private static final Set<String> PUBLIC_EXACT_PATHS = Set.of(
            "/api/v1/auth/login",
            "/api/v1/auth/register",
            "/api/v1/auth/refresh-token",
            "/api/v1/auth/social",
            "/api/v1/auth/social/google",
            "/api/v1/auth/social/facebook",
            "/api/v1/auth/logout",
            "/api/v1/payments/ipn",
            "/api/v1/payments/callback",
            "/api/v1/system/health"
    );

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        if (!(req instanceof HttpServletRequest httpReq) || !(res instanceof HttpServletResponse httpRes)) {
            chain.doFilter(req, res);
            return;
        }

        // Chuẩn hóa path: loại bỏ contextPath (nếu có, ví dụ /web1_war_exploded)
        String uri = httpReq.getRequestURI();
        String contextPath = httpReq.getContextPath();
        String path = (contextPath != null && !contextPath.isEmpty() && uri.startsWith(contextPath))
                ? uri.substring(contextPath.length())
                : uri;
        String method = httpReq.getMethod();

        // 1. Kiểm tra nếu là endpoint public
        boolean isPublic = isPublicEndpoint(method, path);

        // 2. Trích xuất Authorization header
        String authHeader = httpReq.getHeader(AUTH_HEADER);

        if (authHeader != null && authHeader.startsWith(BEARER_PREFIX)) {
            String token = authHeader.substring(BEARER_PREFIX.length()).trim();
            try {
                AuthenticatedUser user = jwtProvider.validateAndExtractUser(token);
                httpReq.setAttribute(CURRENT_USER_ATTR, user);
            } catch (Exception e) {
                if (!isPublic) {
                    sendUnauthorized(httpRes, "Token không hợp lệ hoặc đã hết hạn.");
                    return;
                }
            }
        } else if (!isPublic) {
            sendUnauthorized(httpRes, "Vui lòng đăng nhập để thực hiện thao tác này.");
            return;
        }

        chain.doFilter(req, res);
    }

    private boolean isPublicEndpoint(String method, String path) {
        if ("OPTIONS".equalsIgnoreCase(method)) return true;
        if (PUBLIC_EXACT_PATHS.contains(path)) return true;

        // Cho phép toàn bộ endpoint xác thực (/api/v1/auth/*) là public
        if (path.startsWith("/api/v1/auth/")) {
            return true;
        }

        // Cho phép kiểm tra trạng thái sức khỏe hệ thống
        if (path.startsWith("/api/v1/system/health")) {
            return true;
        }

        // Cho phép duyệt danh mục, sản phẩm, đánh giá sản phẩm và thông tin gian hàng công khai với method GET
        if ("GET".equalsIgnoreCase(method)) {
            if (path.startsWith("/api/v1/products")
                    || path.startsWith("/api/v1/categories")
                    || path.startsWith("/api/v1/reviews/products")
                    || path.startsWith("/api/v1/stores")) {
                return true;
            }
        }

        return false;
    }

    private void sendUnauthorized(HttpServletResponse resp, String message) throws IOException {
        resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        resp.setContentType("application/json; charset=UTF-8");
        ApiResponse<Void> body = ApiResponse.fail(ApiError.of("UNAUTHORIZED", message));
        objectMapper.writeValue(resp.getOutputStream(), body);
    }
}

