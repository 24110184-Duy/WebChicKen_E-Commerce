package com.example.webchicken.modules.identity.service;

import com.example.webchicken.modules.identity.model.dto.request.LoginRequest;
import com.example.webchicken.modules.identity.model.dto.request.RegisterRequest;
import com.example.webchicken.modules.identity.model.dto.response.AuthResponse;

/**
 * Interface nghiệp vụ xác thực (Authentication & Session Management).
 */
public interface AuthService {

    /** Đăng ký tài khoản khách hàng mới */
    AuthResponse register(RegisterRequest request);

    /** Đăng nhập hệ thống bằng email và mật khẩu */
    AuthResponse login(LoginRequest request);

    /** Xoay vòng Refresh Token (Token Rotation) tạo Access Token mới */
    String refreshToken(String rawRefreshToken);

    /** Tạo và lưu Refresh Token mới vào DB */
    String createRefreshToken(String userId);

    /** Đăng xuất phiên làm việc hiện tại */
    void logout(String rawRefreshToken);

    /** Đăng nhập hoặc đăng ký tự động bằng Google ID Token */
    AuthResponse loginWithGoogle(String idToken);

    /** Đăng nhập hoặc đăng ký tự động bằng tài khoản mạng xã hội (Google, Facebook) */
    AuthResponse loginWithSocial(com.example.webchicken.modules.identity.model.dto.request.SocialLoginRequest request);
}

