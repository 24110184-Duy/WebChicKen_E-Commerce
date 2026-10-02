package com.example.webchicken.modules.catalog.model.dto.response;

import java.time.LocalDateTime;

public record CategoryResponse(
        String id,
        String name,
        String description,
        LocalDateTime createdAt
) {}
