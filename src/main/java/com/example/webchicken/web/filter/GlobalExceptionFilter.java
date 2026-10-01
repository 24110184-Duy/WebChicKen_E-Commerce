package com.example.webchicken.web.filter;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

/** Filter 2/9 — Bắt mọi exception chưa xử lý, trả JSON chuẩn ApiResponse. */
public class GlobalExceptionFilter implements Filter {
    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        // TODO: implement
        chain.doFilter(req, res);
    }
}
