package com.example.webchicken.modules.identity.model.dto.request;

/**
 * Yêu cầu đăng ký tài khoản khách hàng mới.
 * Người dùng chỉ cần cung cấp 1 trong 3 thông tin định danh: Username, Email hoặc Số điện thoại.
 */
public record RegisterRequest(
        String identifier,
        String username,
        String email,
        String phone,
        String password,
        String fullName
) {}
