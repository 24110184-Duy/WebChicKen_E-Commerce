package com.example.webchicken.modules.catalog.service.impl;

import com.example.webchicken.modules.catalog.dao.ProductVariantDAO;
import com.example.webchicken.modules.catalog.service.ProductVariantService;
import java.util.Objects;

public class ProductVariantServiceImpl implements ProductVariantService {

    private final ProductVariantDAO productVariantDAO;

    public ProductVariantServiceImpl(ProductVariantDAO productVariantDAO) {
        this.productVariantDAO = Objects.requireNonNull(productVariantDAO, "productVariantDAO must not be null");
    }

    // TODO: implement methods
}
