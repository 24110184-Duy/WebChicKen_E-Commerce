package com.example.webchicken.web.filter;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

/** Filter 6/9 — Giới hạn tốc độ theo IP/user. */
public class RateLimitFilter implements Filter {
    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        // TODO: implement
        chain.doFilter(req, res);
    }
}
