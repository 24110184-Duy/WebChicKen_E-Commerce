package com.example.webchicken.modules.identity.model.dto.response;

import java.util.List;

/** Thông tin hồ sơ chi tiết của người dùng */
public record UserProfileResponse(
        String userId,
        String email,
        String fullName,
        String phone,
        String logoUrl,
        String status,
        String tier,
        int loyaltyPoint,
        List<String> roles
) {}
