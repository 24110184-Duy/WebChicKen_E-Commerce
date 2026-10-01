package com.example.webchicken.web.filter;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;

import java.io.IOException;
import java.util.UUID;

/**
 * Filter 1/9 — RequestIdFilter
 * <p>
 * Nhiệm vụ:
 * <ul>
 *   <li>Đọc header {@code X-Request-Id} từ client hoặc tự động sinh UUID mới.</li>
 *   <li>Đưa {@code requestId} vào context của Logging (MDC) để mọi log record đều có ID truy vết.</li>
 *   <li>Gắn {@code requestId} vào request attribute để các Filter / Servlet tầng trong sử dụng.</li>
 *   <li>Gắn header {@code X-Request-Id} vào HTTP response cho client đối soát.</li>
 *   <li>Dọn sạch MDC trong khối {@code finally} để tránh rò rỉ dữ liệu khi luồng Tomcat được tái sử dụng.</li>
 * </ul>
 * </p>
 */
public class RequestIdFilter implements Filter {

    public static final String REQUEST_ID_HEADER = "X-Request-Id";
    public static final String REQUEST_ID_ATTRIBUTE = "requestId";
    public static final String MDC_KEY = "requestId";

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        if (!(req instanceof HttpServletRequest httpReq) || !(res instanceof HttpServletResponse httpRes)) {
            chain.doFilter(req, res);
            return;
        }

        String requestId = httpReq.getHeader(REQUEST_ID_HEADER);
        if (requestId == null || requestId.isBlank() || requestId.length() > 64) {
            requestId = UUID.randomUUID().toString();
        }

        // Đưa vào MDC để SLF4J / Logback tự động in trong file log
        MDC.put(MDC_KEY, requestId);

        // Lưu vào request attribute cho servlet / filter phía sau
        httpReq.setAttribute(REQUEST_ID_ATTRIBUTE, requestId);

        // Gửi trả header về cho client
        httpRes.setHeader(REQUEST_ID_HEADER, requestId);

        try {
            chain.doFilter(req, res);
        } finally {
            // Xóa MDC khi kết thúc request để tránh rò rỉ luồng trong ThreadPool
            MDC.remove(MDC_KEY);
        }
    }
}

