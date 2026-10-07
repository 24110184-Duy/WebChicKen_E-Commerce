package com.example.webchicken.modules.catalog.service;

import com.example.webchicken.common.model.PageResult;
import com.example.webchicken.modules.catalog.model.dto.request.CreateProductRequest;
import com.example.webchicken.modules.catalog.model.dto.request.ProductFilterCriteria;
import com.example.webchicken.modules.catalog.model.dto.request.UpdateProductRequest;
import com.example.webchicken.modules.catalog.model.dto.response.ProductDetailResponse;
import com.example.webchicken.modules.catalog.model.dto.response.ProductSummaryResponse;
import com.example.webchicken.modules.catalog.model.enums.ProductStatus;

/**
 * Service quản lý sản phẩm (SPU) và biến thể (SKU).
 */
public interface ProductService {

    ProductDetailResponse createProduct(CreateProductRequest request);

    ProductDetailResponse updateProduct(String id, UpdateProductRequest request);

    ProductDetailResponse getProductDetail(String id);

    ProductSummaryResponse getProductSummary(String id);

    PageResult<ProductSummaryResponse> searchProducts(ProductFilterCriteria filter);

    void changeProductStatus(String id, ProductStatus newStatus);

    ProductDetailResponse reviewProduct(String id, ProductStatus newStatus, String rejectionReason);

    void deleteProduct(String id);
}
