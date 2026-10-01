package com.example.webchicken.web.filter;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

/** Filter 8/9 — Kiểm tra CSRF token cho request mutation. */
public class CsrfGuardFilter implements Filter {
    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        // TODO: implement
        chain.doFilter(req, res);
    }
}
