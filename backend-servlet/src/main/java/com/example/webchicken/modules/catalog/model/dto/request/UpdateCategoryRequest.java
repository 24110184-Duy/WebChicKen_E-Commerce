package com.example.webchicken.modules.catalog.model.dto.request;

public record UpdateCategoryRequest(
        String name,
        String description
) {
    public UpdateCategoryRequest {
        if (name != null) {
            name = name.trim();
        }
        if (description != null) {
            description = description.trim();
        }
    }
}
