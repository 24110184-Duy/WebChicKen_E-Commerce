package com.example.webchicken.modules.catalog.service.impl;

import com.example.webchicken.common.exception.ConflictException;
import com.example.webchicken.common.exception.NotFoundException;
import com.example.webchicken.modules.catalog.dao.CategoryDAO;
import com.example.webchicken.modules.catalog.model.dto.request.CreateCategoryRequest;
import com.example.webchicken.modules.catalog.model.dto.request.UpdateCategoryRequest;
import com.example.webchicken.modules.catalog.model.dto.response.CategoryResponse;
import com.example.webchicken.modules.catalog.model.entity.CategoryEntity;
import com.example.webchicken.modules.catalog.service.CategoryService;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

public class CategoryServiceImpl implements CategoryService {

    private final CategoryDAO categoryDAO;

    public CategoryServiceImpl(CategoryDAO categoryDAO) {
        this.categoryDAO = Objects.requireNonNull(categoryDAO, "categoryDAO must not be null");
    }

    @Override
    public List<CategoryResponse> getAllCategories() {
        return categoryDAO.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public CategoryResponse getCategoryById(String id) {
        CategoryEntity entity = categoryDAO.findById(id)
                .orElseThrow(() -> new NotFoundException("Category not found with id: " + id));
        return mapToResponse(entity);
    }

    @Override
    public CategoryResponse createCategory(CreateCategoryRequest request) {
        if (categoryDAO.findByName(request.name()).isPresent()) {
            throw new ConflictException("Category already exists with name: " + request.name());
        }

        CategoryEntity entity = new CategoryEntity(
                UUID.randomUUID().toString(),
                request.name(),
                request.description(),
                LocalDateTime.now());

        categoryDAO.save(entity);
        return mapToResponse(entity);
    }

    @Override
    public CategoryResponse updateCategory(String id, UpdateCategoryRequest request) {
        CategoryEntity entity = categoryDAO.findById(id)
                .orElseThrow(() -> new NotFoundException("Category not found with id: " + id));

        if (request.name() != null && !request.name().isEmpty()) {
            categoryDAO.findByName(request.name()).ifPresent(existing -> {
                if (!existing.getId().equals(id)) {
                    throw new ConflictException("Category already exists with name: " + request.name());
                }
            });
            entity.setName(request.name());
        }

        if (request.description() != null) {
            entity.setDescription(request.description());
        }

        CategoryEntity updated = categoryDAO.update(entity);
        return mapToResponse(updated);
    }

    @Override
    public void deleteCategory(String id) {
        if (!categoryDAO.existsById(id)) {
            throw new NotFoundException("Category not found with id: " + id);
        }
        categoryDAO.deleteById(id);
    }

    private CategoryResponse mapToResponse(CategoryEntity entity) {
        return new CategoryResponse(
                entity.getId(),
                entity.getName(),
                entity.getDescription(),
                entity.getCreatedAt());
    }
}
