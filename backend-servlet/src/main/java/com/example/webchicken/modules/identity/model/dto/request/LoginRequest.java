package com.example.webchicken.modules.identity.model.dto.request;

/**
 * Yêu cầu đăng nhập tài khoản.
 * Hỗ trợ đăng nhập linh hoạt bằng 1 trong 3 thông tin định danh: Username, Email hoặc Số điện thoại.
 */
public record LoginRequest(
        String identifier,
        String email,
        String password
) {
    /**
     * Trích xuất thông tin định danh hiệu lực (ưu tiên identifier, fallback về email).
     */
    public String getEffectiveIdentifier() {
        if (identifier != null && !identifier.isBlank()) {
            return identifier.trim();
        }
        if (email != null && !email.isBlank()) {
            return email.trim();
        }
        return null;
    }
}
