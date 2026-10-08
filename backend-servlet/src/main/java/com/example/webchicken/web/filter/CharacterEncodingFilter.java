package com.example.webchicken.web.filter;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * Filter 3/9 — CharacterEncodingFilter
 * <p>
 * Ép chuẩn mã hóa UTF-8 cho toàn bộ request body và response content,
 * đảm bảo tiếng Việt có dấu truyền qua lại không bị lỗi font (mojibake).
 * </p>
 */
public class CharacterEncodingFilter implements Filter {

    private static final String ENCODING_UTF8 = "UTF-8";

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        req.setCharacterEncoding(ENCODING_UTF8);
        res.setCharacterEncoding(ENCODING_UTF8);

        if (res instanceof HttpServletResponse httpRes) {
            // Đặt content-type mặc định cho API responses nếu chưa đặt
            httpRes.setContentType("application/json; charset=UTF-8");
        }

        chain.doFilter(req, res);
    }
}

