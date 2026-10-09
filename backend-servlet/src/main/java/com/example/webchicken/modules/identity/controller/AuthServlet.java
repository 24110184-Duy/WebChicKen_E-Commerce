package com.example.webchicken.modules.identity.controller;

import com.example.webchicken.modules.identity.model.dto.request.LoginRequest;
import com.example.webchicken.modules.identity.model.dto.request.RegisterRequest;
import com.example.webchicken.modules.identity.model.dto.request.SocialLoginRequest;
import com.example.webchicken.modules.identity.model.dto.request.TokenRefreshRequest;
import com.example.webchicken.modules.identity.model.dto.response.AuthResponse;
import com.example.webchicken.modules.identity.service.AuthService;
import com.example.webchicken.web.base.BaseApiServlet;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Map;

/**
 * Servlet điều hướng cho các API xác thực: /api/v1/auth/*
 * <ul>
 *   <li>POST /register: Đăng ký khách hàng mới</li>
 *   <li>POST /login: Đăng nhập</li>
 *   <li>POST /social: Đăng nhập / đăng ký qua mạng xã hội (Google / Facebook)</li>
 *   <li>POST /social/google: Đăng nhập Google ID Token</li>
 *   <li>POST /social/facebook: Đăng nhập Facebook Token</li>
 *   <li>POST /refresh-token: Làm mới Access Token qua Cookie HttpOnly</li>
 *   <li>POST /logout: Đăng xuất và hủy phiên làm việc</li>
 * </ul>
 */
@WebServlet(name = "AuthServlet", urlPatterns = {"/api/v1/auth/*"})
public class AuthServlet extends BaseApiServlet {

    private static final String REFRESH_COOKIE_NAME = "refresh_token";

    public AuthServlet() {
        super();
    }

    public AuthServlet(ObjectMapper objectMapper) {
        super(objectMapper);
    }

    private AuthService authService() {
        return getService("authService");
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        if (pathInfo == null) pathInfo = "";

        switch (pathInfo) {
            case "/register" -> handleRegister(req, resp);
            case "/login" -> handleLogin(req, resp);
            case "/social" -> handleSocial(req, resp, null);
            case "/social/google" -> handleSocial(req, resp, "GOOGLE");
            case "/social/facebook" -> handleSocial(req, resp, "FACEBOOK");
            case "/refresh-token" -> handleRefreshToken(req, resp);
            case "/logout" -> handleLogout(req, resp);
            default -> notFound(resp, "Endpoint xác thực không tồn tại: " + pathInfo);
        }
    }


    private void handleRegister(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        RegisterRequest reqBody = readBody(req, RegisterRequest.class);
        AuthResponse authResponse = authService().register(reqBody);

        // Sinh refresh token và gắn vào Cookie HttpOnly an toàn
        String refreshToken = authService().createRefreshToken(authResponse.user().userId());
        setRefreshTokenCookie(resp, refreshToken, 7 * 24 * 60 * 60);

        created(resp, authResponse);
    }

    private void handleLogin(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        LoginRequest reqBody = readBody(req, LoginRequest.class);
        AuthResponse authResponse = authService().login(reqBody);

        String refreshToken = authService().createRefreshToken(authResponse.user().userId());
        setRefreshTokenCookie(resp, refreshToken, 7 * 24 * 60 * 60);

        ok(resp, authResponse);
    }

    private void handleSocial(HttpServletRequest req, HttpServletResponse resp, String overrideProvider) throws IOException {
        SocialLoginRequest reqBody = readBody(req, SocialLoginRequest.class);
        if (overrideProvider != null && !overrideProvider.isBlank()) {
            reqBody = new SocialLoginRequest(overrideProvider, reqBody.idToken(), reqBody.accessToken());
        }

        AuthResponse authResponse = authService().loginWithSocial(reqBody);

        String refreshToken = authService().createRefreshToken(authResponse.user().userId());
        setRefreshTokenCookie(resp, refreshToken, 7 * 24 * 60 * 60);

        ok(resp, authResponse);
    }

    private void handleRefreshToken(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String token = extractRefreshToken(req);
        if (token == null) {
            // Thử đọc từ request body nếu client gửi qua JSON
            try {
                TokenRefreshRequest body = readBody(req, TokenRefreshRequest.class);
                token = body.refreshToken();
            } catch (Exception ignored) {}
        }

        String newAccessToken = authService().refreshToken(token);
        ok(resp, Map.of("accessToken", newAccessToken));
    }

    private void handleLogout(HttpServletRequest req, HttpServletResponse resp) {
        String token = extractRefreshToken(req);
        if (token != null) {
            authService().logout(token);
        }
        // Xóa cookie khỏi trình duyệt
        setRefreshTokenCookie(resp, "", 0);
        noContent(resp);
    }

    private String extractRefreshToken(HttpServletRequest req) {
        Cookie[] cookies = req.getCookies();
        if (cookies != null) {
            for (Cookie c : cookies) {
                if (REFRESH_COOKIE_NAME.equals(c.getName())) {
                    return c.getValue();
                }
            }
        }
        return null;
    }

    private void setRefreshTokenCookie(HttpServletResponse resp, String value, int maxAgeSeconds) {
        Cookie cookie = new Cookie(REFRESH_COOKIE_NAME, value);
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath("/api/v1/auth");
        cookie.setMaxAge(maxAgeSeconds);
        cookie.setAttribute("SameSite", "Strict");
        resp.addCookie(cookie);
    }
}
