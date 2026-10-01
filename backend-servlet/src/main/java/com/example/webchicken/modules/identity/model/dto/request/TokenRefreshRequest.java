package com.example.webchicken.modules.identity.model.dto.request;

/** Yêu cầu làm mới access token */
public record TokenRefreshRequest(
        String refreshToken
) {}
