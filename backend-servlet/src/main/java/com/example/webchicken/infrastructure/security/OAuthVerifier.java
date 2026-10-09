package com.example.webchicken.infrastructure.security;

/**
 * Giao diện xác thực mã thông báo OAuth (Google ID Token, Facebook Token).
 */
public interface OAuthVerifier {

    /**
     * Xác thực token với nhà cung cấp OAuth và trả về thông tin người dùng.
     *
     * @param provider Tên nhà cung cấp ("GOOGLE", "FACEBOOK")
     * @param token    ID Token (Google) hoặc Access Token (Facebook)
     * @return {@link SocialUserProfile}
     */
    SocialUserProfile verifyToken(String provider, String token);
}
