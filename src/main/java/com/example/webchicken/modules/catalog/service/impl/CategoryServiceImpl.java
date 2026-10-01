package com.example.webchicken.modules.catalog.service.impl;

import com.example.webchicken.modules.catalog.dao.CategoryDAO;
import com.example.webchicken.modules.catalog.service.CategoryService;
import java.util.Objects;

public class CategoryServiceImpl implements CategoryService {

    private final CategoryDAO categoryDAO;

    public CategoryServiceImpl(CategoryDAO categoryDAO) {
        this.categoryDAO = Objects.requireNonNull(categoryDAO, "categoryDAO must not be null");
    }

    // TODO: implement methods
}
