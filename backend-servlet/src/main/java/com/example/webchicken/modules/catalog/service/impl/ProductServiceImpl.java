package com.example.webchicken.modules.catalog.service.impl;

import com.example.webchicken.common.exception.NotFoundException;
import com.example.webchicken.common.model.PageResult;
import com.example.webchicken.modules.catalog.dao.CategoryDAO;
import com.example.webchicken.modules.catalog.dao.ProductDAO;
import com.example.webchicken.modules.catalog.dao.ProductImageDAO;
import com.example.webchicken.modules.catalog.dao.ProductVariantDAO;
import com.example.webchicken.modules.catalog.model.dto.request.CreateProductRequest;
import com.example.webchicken.modules.catalog.model.dto.request.CreateVariantRequest;
import com.example.webchicken.modules.catalog.model.dto.request.ProductFilterCriteria;
import com.example.webchicken.modules.catalog.model.dto.request.UpdateProductRequest;
import com.example.webchicken.modules.catalog.model.dto.response.ProductDetailResponse;
import com.example.webchicken.modules.catalog.model.dto.response.ProductSummaryResponse;
import com.example.webchicken.modules.catalog.model.dto.response.ProductVariantResponse;
import com.example.webchicken.modules.catalog.model.entity.ProductEntity;
import com.example.webchicken.modules.catalog.model.entity.ProductImageEntity;
import com.example.webchicken.modules.catalog.model.entity.ProductVariantEntity;
import com.example.webchicken.modules.catalog.model.enums.ProductStatus;
import com.example.webchicken.modules.catalog.service.ProductService;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

public class ProductServiceImpl implements ProductService {

    private final ProductDAO productDAO;
    private final ProductImageDAO productImageDAO;
    private final ProductVariantDAO productVariantDAO;
    private final CategoryDAO categoryDAO;

    public ProductServiceImpl(ProductDAO productDAO,
                              ProductImageDAO productImageDAO,
                              ProductVariantDAO productVariantDAO,
                              CategoryDAO categoryDAO) {
        this.productDAO = Objects.requireNonNull(productDAO, "productDAO must not be null");
        this.productImageDAO = Objects.requireNonNull(productImageDAO, "productImageDAO must not be null");
        this.productVariantDAO = Objects.requireNonNull(productVariantDAO, "productVariantDAO must not be null");
        this.categoryDAO = Objects.requireNonNull(categoryDAO, "categoryDAO must not be null");
    }

    @Override
    public ProductDetailResponse createProduct(CreateProductRequest request) {
        if (!categoryDAO.existsById(request.categoryId())) {
            throw new NotFoundException("Category not found with id: " + request.categoryId());
        }

        String productId = UUID.randomUUID().toString();
        LocalDateTime now = LocalDateTime.now();

        ProductEntity product = new ProductEntity(
                productId,
                request.storeId(),
                request.categoryId(),
                request.name(),
                request.description(),
                ProductStatus.PENDING_APPROVAL,
                now,
                now
        );
        productDAO.save(product);

        // Images
        List<String> savedImages = new ArrayList<>();
        if (request.imageUrls() != null) {
            for (String imgUrl : request.imageUrls()) {
                if (imgUrl != null && !imgUrl.trim().isEmpty()) {
                    ProductImageEntity imgEntity = new ProductImageEntity(
                            UUID.randomUUID().toString(),
                            productId,
                            imgUrl.trim()
                    );
                    productImageDAO.save(imgEntity);
                    savedImages.add(imgEntity.getImageUrl());
                }
            }
        }

        // Variants
        List<ProductVariantResponse> savedVariants = new ArrayList<>();
        for (CreateVariantRequest vReq : request.variants()) {
            ProductVariantEntity vEntity = new ProductVariantEntity(
                    UUID.randomUUID().toString(),
                    productId,
                    vReq.attribute(),
                    vReq.basePriceMinor(),
                    vReq.stockQuantity()
            );
            productVariantDAO.save(vEntity);
            savedVariants.add(new ProductVariantResponse(
                    vEntity.getId(),
                    productId,
                    vEntity.getAttribute(),
                    vEntity.getBasePriceMinor(),
                    vEntity.getStockQuantity()
            ));
        }

        String categoryName = categoryDAO.findById(product.getCategoryId())
                .map(c -> c.getName())
                .orElse("");

        return new ProductDetailResponse(
                product.getId(),
                product.getStoreId(),
                product.getCategoryId(),
                categoryName,
                product.getName(),
                product.getDescription(),
                product.getStatus(),
                savedImages,
                savedVariants,
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }

    @Override
    public ProductDetailResponse updateProduct(String id, UpdateProductRequest request) {
        ProductEntity product = productDAO.findById(id)
                .orElseThrow(() -> new NotFoundException("Product not found with id: " + id));

        if (request.categoryId() != null && !request.categoryId().isEmpty()) {
            if (!categoryDAO.existsById(request.categoryId())) {
                throw new NotFoundException("Category not found with id: " + request.categoryId());
            }
            product.setCategoryId(request.categoryId());
        }

        if (request.name() != null && !request.name().isEmpty()) {
            product.setName(request.name());
        }

        if (request.description() != null) {
            product.setDescription(request.description());
        }

        if (request.status() != null) {
            product.setStatus(request.status());
        }

        product.setUpdatedAt(LocalDateTime.now());
        ProductEntity updated = productDAO.update(product);

        return getProductDetail(updated.getId());
    }

    @Override
    public ProductDetailResponse getProductDetail(String id) {
        ProductEntity product = productDAO.findById(id)
                .orElseThrow(() -> new NotFoundException("Product not found with id: " + id));

        String categoryName = categoryDAO.findById(product.getCategoryId())
                .map(c -> c.getName())
                .orElse("");

        List<String> imageUrls = productImageDAO.findByProductId(id).stream()
                .map(ProductImageEntity::getImageUrl)
                .collect(Collectors.toList());

        List<ProductVariantResponse> variants = productVariantDAO.findByProductId(id).stream()
                .map(v -> new ProductVariantResponse(
                        v.getId(),
                        v.getProductId(),
                        v.getAttribute(),
                        v.getBasePriceMinor(),
                        v.getStockQuantity()
                ))
                .collect(Collectors.toList());

        return new ProductDetailResponse(
                product.getId(),
                product.getStoreId(),
                product.getCategoryId(),
                categoryName,
                product.getName(),
                product.getDescription(),
                product.getStatus(),
                imageUrls,
                variants,
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }

    @Override
    public ProductSummaryResponse getProductSummary(String id) {
        ProductEntity product = productDAO.findById(id)
                .orElseThrow(() -> new NotFoundException("Product not found with id: " + id));
        return toSummary(product);
    }

    @Override
    public PageResult<ProductSummaryResponse> searchProducts(ProductFilterCriteria filter) {
        List<ProductEntity> products = productDAO.findWithFilters(filter);
        long total = productDAO.countWithFilters(filter);

        List<ProductSummaryResponse> items = products.stream()
                .map(this::toSummary)
                .collect(Collectors.toList());

        return new PageResult<>(items, total, filter.page(), filter.size());
    }

    @Override
    public void changeProductStatus(String id, ProductStatus newStatus) {
        ProductEntity product = productDAO.findById(id)
                .orElseThrow(() -> new NotFoundException("Product not found with id: " + id));
        product.setStatus(newStatus);
        product.setUpdatedAt(LocalDateTime.now());
        productDAO.update(product);
    }

    @Override
    public void deleteProduct(String id) {
        if (!productDAO.existsById(id)) {
            throw new NotFoundException("Product not found with id: " + id);
        }
        productVariantDAO.deleteByProductId(id);
        productImageDAO.deleteByProductId(id);
        productDAO.deleteById(id);
    }

    private ProductSummaryResponse toSummary(ProductEntity p) {
        List<ProductImageEntity> images = productImageDAO.findByProductId(p.getId());
        String thumb = images.isEmpty() ? null : images.get(0).getImageUrl();

        List<ProductVariantEntity> variants = productVariantDAO.findByProductId(p.getId());
        long minPrice = variants.stream().mapToLong(ProductVariantEntity::getBasePriceMinor).min().orElse(0L);
        long maxPrice = variants.stream().mapToLong(ProductVariantEntity::getBasePriceMinor).max().orElse(0L);
        int totalStock = variants.stream().mapToInt(ProductVariantEntity::getStockQuantity).sum();

        return new ProductSummaryResponse(
                p.getId(),
                p.getStoreId(),
                p.getCategoryId(),
                p.getName(),
                p.getStatus(),
                thumb,
                minPrice,
                maxPrice,
                totalStock,
                p.getCreatedAt()
        );
    }
}
