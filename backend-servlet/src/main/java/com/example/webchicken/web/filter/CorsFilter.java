package com.example.webchicken.web.filter;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * Filter 4/9 — CorsFilter (ARCHITECTURE.md 1.7)
 * <p>
 * Xử lý chính sách CORS cho môi trường Dev và Production:
 * <ul>
 *   <li>Kiểm tra Origin theo danh sách trắng (whitelist), tuyệt đối không dùng {@code *} vì có {@code credentials: true}.</li>
 *   <li>Cho phép các method: GET, POST, PUT, PATCH, DELETE, OPTIONS.</li>
 *   <li>Cho phép các headers: Authorization, Content-Type, Accept-Language, Idempotency-Key, X-Request-Id.</li>
 *   <li>Expose các headers: X-Request-Id, Location, ETag, Retry-After.</li>
 *   <li>Preflight (OPTIONS) trả {@code 204 No Content} ngay lập tức (không chạy tiếp filter chain).</li>
 * </ul>
 * </p>
 */
public class CorsFilter implements Filter {

    private static final Set<String> DEFAULT_ALLOWED_ORIGINS = new HashSet<>(Arrays.asList(
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://localhost:8080"
    ));

    private Set<String> allowedOrigins;

    @Override
    public void init(FilterConfig filterConfig) {
        String configuredOrigins = System.getenv("CORS_ALLOWED_ORIGINS");
        if (configuredOrigins == null || configuredOrigins.isBlank()) {
            configuredOrigins = System.getProperty("cors.allowed-origins");
        }

        if (configuredOrigins != null && !configuredOrigins.isBlank()) {
            allowedOrigins = new HashSet<>(Arrays.asList(configuredOrigins.split(",")));
        } else {
            allowedOrigins = DEFAULT_ALLOWED_ORIGINS;
        }
    }

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        if (!(req instanceof HttpServletRequest httpReq) || !(res instanceof HttpServletResponse httpRes)) {
            chain.doFilter(req, res);
            return;
        }

        String origin = httpReq.getHeader("Origin");
        if (origin != null && isOriginAllowed(origin)) {
            httpRes.setHeader("Access-Control-Allow-Origin", origin);
            httpRes.setHeader("Access-Control-Allow-Credentials", "true");
            httpRes.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
            httpRes.setHeader("Access-Control-Allow-Headers",
                    "Authorization, Content-Type, Accept-Language, Idempotency-Key, X-Request-Id");
            httpRes.setHeader("Access-Control-Expose-Headers", "X-Request-Id, Location, ETag, Retry-After");
            httpRes.setHeader("Access-Control-Max-Age", "3600");
            httpRes.setHeader("Vary", "Origin");
        }

        // Nếu là preflight OPTIONS request, phản hồi 204 No Content ngay lập tức
        if ("OPTIONS".equalsIgnoreCase(httpReq.getMethod())) {
            httpRes.setStatus(HttpServletResponse.SC_NO_CONTENT);
            return;
        }

        chain.doFilter(req, res);
    }

    private boolean isOriginAllowed(String origin) {
        if (allowedOrigins == null) {
            allowedOrigins = DEFAULT_ALLOWED_ORIGINS;
        }
        return allowedOrigins.contains(origin.trim());
    }
}

