package com.example.webchicken.modules.identity.model.dto.request;

/** Cập nhật thông tin cá nhân */
public record UpdateProfileRequest(
        String fullName,
        String phone,
        String logoUrl
) {}
