package com.example.webchicken.modules.catalog.service;

import com.example.webchicken.modules.catalog.model.dto.request.CreateCategoryRequest;
import com.example.webchicken.modules.catalog.model.dto.request.UpdateCategoryRequest;
import com.example.webchicken.modules.catalog.model.dto.response.CategoryResponse;
import java.util.List;

/**
 * Service quản lý danh mục sản phẩm (Category).
 */
public interface CategoryService {

    List<CategoryResponse> getAllCategories();

    CategoryResponse getCategoryById(String id);

    CategoryResponse createCategory(CreateCategoryRequest request);

    CategoryResponse updateCategory(String id, UpdateCategoryRequest request);

    void deleteCategory(String id);
}
