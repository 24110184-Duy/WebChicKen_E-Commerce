package com.example.webchicken.web.filter;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

/** Filter 9/9 — Kiểm tra quyền theo path pattern và vai trò. */
public class AuthorizationFilter implements Filter {
    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        // TODO: implement
        chain.doFilter(req, res);
    }
}
