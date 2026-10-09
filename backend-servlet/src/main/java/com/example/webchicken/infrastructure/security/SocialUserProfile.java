package com.example.webchicken.infrastructure.security;

/**
 * Hồ sơ người dùng trích xuất từ nhà cung cấp OAuth (Google, Facebook).
 */
public record SocialUserProfile(
    String provider,
    String providerUserId,
    String email,
    String name,
    String avatarUrl
) {}
