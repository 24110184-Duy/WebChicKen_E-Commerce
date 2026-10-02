package com.example.webchicken.modules.catalog.model.dto.request;

public record CreateCategoryRequest(
        String name,
        String description
) {
    public CreateCategoryRequest {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Category name must not be empty");
        }
        name = name.trim();
        if (description != null) {
            description = description.trim();
        }
    }
}
