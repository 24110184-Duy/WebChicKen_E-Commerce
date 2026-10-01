package com.example.webchicken.web.filter;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

/** Filter 3/9 — Đặt charset UTF-8 cho request/response. */
public class CharacterEncodingFilter implements Filter {
    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        // TODO: implement
        chain.doFilter(req, res);
    }
}
