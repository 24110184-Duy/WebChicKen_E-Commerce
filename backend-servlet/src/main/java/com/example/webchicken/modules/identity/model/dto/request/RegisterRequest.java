package com.example.webchicken.modules.identity.model.dto.request;

/** Yêu cầu đăng ký tài khoản khách hàng mới */
public record RegisterRequest(
        String email,
        String password,
        String fullName,
        String phone
) {}
