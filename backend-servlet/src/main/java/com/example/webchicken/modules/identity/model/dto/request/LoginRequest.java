package com.example.webchicken.modules.identity.model.dto.request;

/** Yêu cầu đăng nhập tài khoản */
public record LoginRequest(
        String email,
        String password
) {}
