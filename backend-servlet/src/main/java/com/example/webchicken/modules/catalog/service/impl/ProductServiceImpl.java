package com.example.webchicken.modules.catalog.service.impl;

import com.example.webchicken.modules.catalog.dao.ProductDAO;
import com.example.webchicken.modules.catalog.dao.ProductImageDAO;
import com.example.webchicken.modules.catalog.service.ProductService;
import java.util.Objects;

public class ProductServiceImpl implements ProductService {

    private final ProductDAO productDAO;
    private final ProductImageDAO productImageDAO;

    public ProductServiceImpl(ProductDAO productDAO, ProductImageDAO productImageDAO) {
        this.productDAO = Objects.requireNonNull(productDAO, "productDAO must not be null");
        this.productImageDAO = Objects.requireNonNull(productImageDAO, "productImageDAO must not be null");
    }

    // TODO: implement methods
}
