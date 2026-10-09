package com.example.webchicken.modules.identity.model.dto.request;

/**
 * DTO nhận yêu cầu đăng nhập/đăng ký qua tài khoản mạng xã hội (Google, Facebook).
 */
public record SocialLoginRequest(
    String provider,
    String idToken,
    String accessToken
) {
    public String getEffectiveToken() {
        if (idToken != null && !idToken.isBlank()) {
            return idToken.trim();
        }
        if (accessToken != null && !accessToken.isBlank()) {
            return accessToken.trim();
        }
        return null;
    }

    public String getEffectiveProvider() {
        if (provider != null && !provider.isBlank()) {
            return provider.trim().toUpperCase();
        }
        return "GOOGLE";
    }
}
