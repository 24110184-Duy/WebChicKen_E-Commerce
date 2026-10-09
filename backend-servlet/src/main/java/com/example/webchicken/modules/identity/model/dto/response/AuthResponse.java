package com.example.webchicken.modules.identity.model.dto.response;

import java.util.List;

/** Kết quả trả về sau khi đăng nhập / đăng ký thành công */
public record AuthResponse(
        String accessToken,
        UserInfo user
) {
    public record UserInfo(
            String userId,
            String email,
            String fullName,
            String phone,
            String logoUrl,
            List<String> roles,
            String username
    ) {
        public UserInfo(String userId, String email, String fullName, String phone, String logoUrl, List<String> roles) {
            this(userId, email, fullName, phone, logoUrl, roles, null);
        }
    }
}
