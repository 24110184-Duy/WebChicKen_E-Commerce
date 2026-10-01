package com.example.webchicken.web.filter;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * Filter 5/9 — SecurityHeadersFilter
 * <p>
 * Bổ sung các HTTP Security Headers theo tiêu chuẩn OWASP:
 * <ul>
 *   <li>{@code X-Content-Type-Options: nosniff} — Chống MIME sniffing.</li>
 *   <li>{@code X-Frame-Options: DENY} — Chống tấn công Clickjacking.</li>
 *   <li>{@code Strict-Transport-Security} — Ép buộc HTTPS (HSTS).</li>
 *   <li>{@code Referrer-Policy: strict-origin-when-cross-origin} — Bảo vệ thông tin referrer.</li>
 *   <li>{@code Cache-Control: no-store} — Không lưu cache các phản hồi API nhạy cảm.</li>
 * </ul>
 * </p>
 */
public class SecurityHeadersFilter implements Filter {

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        if (res instanceof HttpServletResponse httpRes) {
            httpRes.setHeader("X-Content-Type-Options", "nosniff");
            httpRes.setHeader("X-Frame-Options", "DENY");
            httpRes.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
            httpRes.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
            httpRes.setHeader("X-XSS-Protection", "1; mode=block");

            if (req instanceof HttpServletRequest httpReq && httpReq.getRequestURI().startsWith("/api/")) {
                httpRes.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
                httpRes.setHeader("Pragma", "no-cache");
                httpRes.setHeader("Expires", "0");
            }
        }

        chain.doFilter(req, res);
    }
}

