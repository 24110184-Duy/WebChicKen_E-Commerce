package com.example.webchicken.web.filter;

import com.example.webchicken.common.model.ApiError;
import com.example.webchicken.common.model.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Filter 6/9 — RateLimitFilter (ARCHITECTURE.md 1.6)
 * <p>
 * Giới hạn tần suất request (Rate Limiting) theo địa chỉ IP bằng thuật toán Token Bucket:
 * <ul>
 *   <li>Bảo vệ hệ thống khỏi các cuộc tấn công Brute-force và DoS.</li>
 *   <li>Nếu vượt ngưỡng, phản hồi HTTP {@code 429 Too Many Requests} kèm header {@code Retry-After}.</li>
 * </ul>
 * </p>
 */
public class RateLimitFilter implements Filter {

    private static final int MAX_REQUESTS_PER_SECOND = 20;
    private final ConcurrentHashMap<String, TokenBucket> ipBuckets = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        if (!(req instanceof HttpServletRequest httpReq) || !(res instanceof HttpServletResponse httpRes)) {
            chain.doFilter(req, res);
            return;
        }

        String clientIp = getClientIp(httpReq);
        TokenBucket bucket = ipBuckets.computeIfAbsent(clientIp, k -> new TokenBucket(MAX_REQUESTS_PER_SECOND));

        if (!bucket.tryConsume()) {
            httpRes.setStatus(429); // 429 Too Many Requests
            httpRes.setHeader("Retry-After", "1");
            httpRes.setContentType("application/json; charset=UTF-8");

            ApiResponse<Void> errorResp = ApiResponse.fail(
                    ApiError.of("RATE_LIMIT_EXCEEDED", "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 1 giây.")
            );
            objectMapper.writeValue(httpRes.getOutputStream(), errorResp);
            return;
        }

        // Dọn dẹp cache nếu lượng IP vượt quá 10.000 để tránh tràn bộ nhớ
        if (ipBuckets.size() > 10000) {
            ipBuckets.clear();
        }

        chain.doFilter(req, res);
    }

    private String getClientIp(HttpServletRequest req) {
        String xForwardedFor = req.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return req.getRemoteAddr();
    }

    /**
     * Cài đặt đơn giản Token Bucket luân chuyển theo giây
     */
    private static class TokenBucket {
        private final int capacity;
        private final AtomicInteger tokens;
        private volatile long lastRefillTimestamp;

        public TokenBucket(int capacity) {
            this.capacity = capacity;
            this.tokens = new AtomicInteger(capacity);
            this.lastRefillTimestamp = System.currentTimeMillis();
        }

        public synchronized boolean tryConsume() {
            refill();
            if (tokens.get() > 0) {
                tokens.decrementAndGet();
                return true;
            }
            return false;
        }

        private void refill() {
            long now = System.currentTimeMillis();
            if (now - lastRefillTimestamp >= 1000) {
                tokens.set(capacity);
                lastRefillTimestamp = now;
            }
        }
    }
}

