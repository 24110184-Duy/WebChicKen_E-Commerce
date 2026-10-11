package com.example.webchicken.modules.catalog.service.impl;

import com.example.webchicken.common.exception.NotFoundException;
import com.example.webchicken.common.exception.ValidationException;
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
import com.example.webchicken.modules.review.service.ReviewService;
import com.example.webchicken.modules.review.model.dto.response.ReviewSummaryResponse;
import com.example.webchicken.modules.order.service.OrderService;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

public class ProductServiceImpl implements ProductService {

    private final ProductDAO productDAO;
    private final ProductImageDAO productImageDAO;
    private final ProductVariantDAO productVariantDAO;
    private final CategoryDAO categoryDAO;
    private final ReviewService reviewService;
    private final OrderService orderService;

    public ProductServiceImpl(ProductDAO productDAO,
                              ProductImageDAO productImageDAO,
                              ProductVariantDAO productVariantDAO,
                              CategoryDAO categoryDAO) {
        this(productDAO, productImageDAO, productVariantDAO, categoryDAO, null, null);
    }

    public ProductServiceImpl(ProductDAO productDAO,
                              ProductImageDAO productImageDAO,
                              ProductVariantDAO productVariantDAO,
                              CategoryDAO categoryDAO,
                              ReviewService reviewService,
                              OrderService orderService) {
        this.productDAO = Objects.requireNonNull(productDAO, "productDAO must not be null");
        this.productImageDAO = Objects.requireNonNull(productImageDAO, "productImageDAO must not be null");
        this.productVariantDAO = Objects.requireNonNull(productVariantDAO, "productVariantDAO must not be null");
        this.categoryDAO = Objects.requireNonNull(categoryDAO, "categoryDAO must not be null");
        this.reviewService = reviewService;
        this.orderService = orderService;
    }

    @Override
    public ProductDetailResponse createProduct(CreateProductRequest request) {
        if (!categoryDAO.existsById(request.categoryId())) {
            throw new NotFoundException("Category not found with id: " + request.categoryId());
        }

        String productId = UUID.randomUUID().toString();
        LocalDateTime now = LocalDateTime.now();

        // BẮT BUỘC: Khi seller tạo sản phẩm mới, trạng thái ban đầu PHẢI LÀ PENDING_APPROVAL
        // (chờ Admin phê duyệt) hoặc INACTIVE (lưu bản nháp).
        // Tuyệt đối không cho phép tự kích hoạt thành ACTIVE trực tiếp khi tạo mới.
        ProductStatus initialStatus = (request.status() == ProductStatus.INACTIVE)
                ? ProductStatus.INACTIVE
                : ProductStatus.PENDING_APPROVAL;

        ProductEntity product = new ProductEntity(
                productId,
                request.storeId(),
                request.categoryId(),
                request.name(),
                request.description(),
                initialStatus,
                now,
                now
        );
        productDAO.save(product);

        // Images
        List<String> savedImages = new ArrayList<>();
        if (request.imageUrls() != null) {
            for (String imgUrl : request.imageUrls()) {
                if (imgUrl != null && !imgUrl.trim().isEmpty()) {
                    String cleanUrl = imgUrl.trim();
                    if (cleanUrl.length() > 500) {
                        throw new ValidationException("Đường dẫn hình ảnh vượt quá giới hạn 500 ký tự. Vui lòng tải ảnh qua chức năng tải tệp (/api/v1/media/upload).");
                    }
                    ProductImageEntity imgEntity = new ProductImageEntity(
                            UUID.randomUUID().toString(),
                            productId,
                            cleanUrl
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
                product.getRejectionReason(),
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
            if (request.status() == ProductStatus.ACTIVE && product.getStatus() != ProductStatus.ACTIVE) {
                if (product.getStatus() == ProductStatus.PENDING_APPROVAL || product.getRejectionReason() != null) {
                    throw new ValidationException("Sản phẩm cần có sự phê duyệt của Quản trị viên (Admin) trước khi có thể mở bán công khai.");
                }
            }
            product.setStatus(request.status());
        }

        product.setUpdatedAt(LocalDateTime.now());
        ProductEntity updated = productDAO.update(product);

        // Cập nhật danh sách hình ảnh sản phẩm nếu có truyền lên
        if (request.imageUrls() != null && !request.imageUrls().isEmpty()) {
            productImageDAO.deleteByProductId(id);
            for (String imgUrl : request.imageUrls()) {
                if (imgUrl != null && !imgUrl.trim().isEmpty()) {
                    String cleanUrl = imgUrl.trim();
                    if (cleanUrl.length() > 500) {
                        throw new ValidationException("Đường dẫn hình ảnh vượt quá giới hạn 500 ký tự. Vui lòng tải ảnh qua chức năng tải tệp (/api/v1/media/upload).");
                    }
                    ProductImageEntity imgEntity = new ProductImageEntity(
                            UUID.randomUUID().toString(),
                            id,
                            cleanUrl
                    );
                    productImageDAO.save(imgEntity);
                }
            }
        }

        // Cập nhật danh sách biến thể sản phẩm nếu có truyền lên
        if (request.variants() != null && !request.variants().isEmpty()) {
            List<ProductVariantEntity> existingVariants = productVariantDAO.findByProductId(id);
            Map<String, ProductVariantEntity> existingMap = existingVariants.stream()
                    .collect(Collectors.toMap(ProductVariantEntity::getAttribute, v -> v, (v1, v2) -> v1));

            List<String> updatedVariantIds = new ArrayList<>();

            for (CreateVariantRequest vReq : request.variants()) {
                ProductVariantEntity existing = existingMap.get(vReq.attribute());
                if (existing != null) {
                    existing.setBasePriceMinor(vReq.basePriceMinor());
                    existing.setStockQuantity(vReq.stockQuantity());
                    productVariantDAO.update(existing);
                    updatedVariantIds.add(existing.getId());
                } else {
                    ProductVariantEntity newVariant = new ProductVariantEntity(
                            UUID.randomUUID().toString(),
                            id,
                            vReq.attribute(),
                            vReq.basePriceMinor(),
                            vReq.stockQuantity()
                    );
                    productVariantDAO.save(newVariant);
                    updatedVariantIds.add(newVariant.getId());
                }
            }

            for (ProductVariantEntity oldV : existingVariants) {
                if (!updatedVariantIds.contains(oldV.getId())) {
                    try {
                        productVariantDAO.deleteById(oldV.getId());
                    } catch (Exception ignored) {}
                }
            }
        }

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

        ReviewSummaryResponse reviewSummary = reviewService != null ? reviewService.getProductReviewSummary(id) : null;
        double rating = reviewSummary != null ? reviewSummary.averageRating() : 0.0;
        int ratingCount = reviewSummary != null ? (int) reviewSummary.totalReviews() : 0;

        int soldCount = 0;
        if (orderService != null) {
            Map<String, Integer> soldMap = orderService.getProductSoldCounts(List.of(id));
            soldCount = soldMap.getOrDefault(id, 0);
        }

        return new ProductDetailResponse(
                product.getId(),
                product.getStoreId(),
                product.getCategoryId(),
                categoryName,
                product.getName(),
                product.getDescription(),
                product.getStatus(),
                product.getRejectionReason(),
                imageUrls,
                variants,
                rating,
                ratingCount,
                soldCount,
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

        List<String> productIds = products.stream().map(ProductEntity::getId).toList();
        Map<String, ReviewSummaryResponse> reviewSummaries = reviewService != null && !productIds.isEmpty()
                ? reviewService.getProductReviewSummaries(productIds)
                : Collections.emptyMap();
        Map<String, Integer> soldCounts = orderService != null && !productIds.isEmpty()
                ? orderService.getProductSoldCounts(productIds)
                : Collections.emptyMap();

        List<ProductSummaryResponse> items = products.stream()
                .map(p -> toSummary(p, reviewSummaries.get(p.getId()), soldCounts.getOrDefault(p.getId(), 0)))
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
    public ProductDetailResponse reviewProduct(String id, ProductStatus newStatus, String rejectionReason) {
        ProductEntity product = productDAO.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy sản phẩm với id: " + id));

        product.setStatus(newStatus);
        if (newStatus == ProductStatus.ACTIVE) {
            product.setRejectionReason(null);
        } else if (newStatus == ProductStatus.INACTIVE || newStatus == ProductStatus.PENDING_APPROVAL) {
            if (rejectionReason != null && !rejectionReason.isBlank()) {
                product.setRejectionReason(rejectionReason.trim());
            }
        }
        product.setUpdatedAt(LocalDateTime.now());
        productDAO.update(product);

        return getProductDetail(id);
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
        ReviewSummaryResponse rev = reviewService != null ? reviewService.getProductReviewSummary(p.getId()) : null;
        int sold = 0;
        if (orderService != null) {
            Map<String, Integer> soldMap = orderService.getProductSoldCounts(List.of(p.getId()));
            sold = soldMap.getOrDefault(p.getId(), 0);
        }
        return toSummary(p, rev, sold);
    }

    private ProductSummaryResponse toSummary(ProductEntity p, ReviewSummaryResponse rev, int soldCount) {
        List<ProductImageEntity> images = productImageDAO.findByProductId(p.getId());
        String thumb = images.isEmpty() ? null : images.get(0).getImageUrl();

        List<ProductVariantEntity> variants = productVariantDAO.findByProductId(p.getId());
        long minPrice = variants.stream().mapToLong(ProductVariantEntity::getBasePriceMinor).min().orElse(0L);
        long maxPrice = variants.stream().mapToLong(ProductVariantEntity::getBasePriceMinor).max().orElse(0L);
        int totalStock = variants.stream().mapToInt(ProductVariantEntity::getStockQuantity).sum();

        double rating = rev != null ? rev.averageRating() : 0.0;
        int ratingCount = rev != null ? (int) rev.totalReviews() : 0;

        return new ProductSummaryResponse(
                p.getId(),
                p.getStoreId(),
                p.getCategoryId(),
                p.getName(),
                p.getStatus(),
                p.getRejectionReason(),
                thumb,
                minPrice,
                maxPrice,
                totalStock,
                rating,
                ratingCount,
                soldCount,
                p.getCreatedAt()
        );
    }
}
