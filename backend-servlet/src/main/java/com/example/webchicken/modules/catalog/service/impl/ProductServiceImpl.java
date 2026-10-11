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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

public class ProductServiceImpl implements ProductService {

    private static final Logger log = LoggerFactory.getLogger(ProductServiceImpl.class);

    /**
     * Danh mục từ khóa nghi vấn, nhạy cảm liên quan đến dược phẩm, thuốc chữa bệnh,
     * thực phẩm chức năng cấp tốc, sinh lý, y tế và an toàn sức khỏe người tiêu dùng.
     * Khi phát hiện các yếu tố này, BOT sẽ KHÔNG tự động duyệt mà chuyển giao cho ADMIN kiểm duyệt.
     */
    private static final List<String> HEALTH_AND_SAFETY_KEYWORDS = List.of(
            "thuoc", "thuốc", "duoc", "dược", "khang sinh", "kháng sinh",
            "dac tri", "đặc trị", "chua benh", "chữa bệnh", "tri benh", "trị bệnh",
            "than duoc", "thần dược", "chua khoi", "chữa khỏi", "thuoc nam", "thuốc nam",
            "thuoc bac", "thuốc bắc", "dong y", "đông y", "thuc pham chuc nang", "thực phẩm chức năng",
            "sinh ly", "sinh lý", "kich duc", "kích dục", "giam can cap toc", "giảm cân cấp tốc",
            "tang can cap toc", "tăng cân cấp tốc", "y te", "y tế", "doc hai", "độc hại",
            "tiem", "tiêm", "truyen dich", "truyền dịch", "vac xin", "vắc xin", "vaccine",
            "hoa chat", "hóa chất", "chat cam", "chất cấm", "thuoc boi", "thuốc bôi",
            "thuoc uong", "thuốc uống", "kem tron", "kem trộn", "tri mun cap toc", "trị mụn cấp tốc",
            "tri nam cap toc", "trị nám cấp tốc", "duong trang cap toc", "dưỡng trắng cấp tốc"
    );

    public static boolean isHealthOrSafetyRisk(String name, String description) {
        String combined = ((name != null ? name : "") + " " + (description != null ? description : "")).toLowerCase();
        for (String kw : HEALTH_AND_SAFETY_KEYWORDS) {
            if (combined.contains(kw)) {
                return true;
            }
        }
        return false;
    }

    private final ProductDAO productDAO;
    private final ProductImageDAO productImageDAO;
    private final ProductVariantDAO productVariantDAO;
    private final CategoryDAO categoryDAO;
    private final ReviewService reviewService;
    private final OrderService orderService;
    private final com.example.webchicken.modules.shop.dao.StoreDAO storeDAO;

    public ProductServiceImpl(ProductDAO productDAO,
                              ProductImageDAO productImageDAO,
                              ProductVariantDAO productVariantDAO,
                              CategoryDAO categoryDAO) {
        this(productDAO, productImageDAO, productVariantDAO, categoryDAO, null, null, null);
    }

    public ProductServiceImpl(ProductDAO productDAO,
                              ProductImageDAO productImageDAO,
                              ProductVariantDAO productVariantDAO,
                              CategoryDAO categoryDAO,
                              ReviewService reviewService,
                              OrderService orderService) {
        this(productDAO, productImageDAO, productVariantDAO, categoryDAO, reviewService, orderService, null);
    }

    public ProductServiceImpl(ProductDAO productDAO,
                              ProductImageDAO productImageDAO,
                              ProductVariantDAO productVariantDAO,
                              CategoryDAO categoryDAO,
                              ReviewService reviewService,
                              OrderService orderService,
                              com.example.webchicken.modules.shop.dao.StoreDAO storeDAO) {
        this.productDAO = Objects.requireNonNull(productDAO, "productDAO must not be null");
        this.productImageDAO = Objects.requireNonNull(productImageDAO, "productImageDAO must not be null");
        this.productVariantDAO = Objects.requireNonNull(productVariantDAO, "productVariantDAO must not be null");
        this.categoryDAO = Objects.requireNonNull(categoryDAO, "categoryDAO must not be null");
        this.reviewService = reviewService;
        this.orderService = orderService;
        this.storeDAO = storeDAO;
    }

    @Override
    public ProductDetailResponse createProduct(CreateProductRequest request) {
        if (!categoryDAO.existsById(request.categoryId())) {
            throw new NotFoundException("Category not found with id: " + request.categoryId());
        }

        String productId = UUID.randomUUID().toString();
        LocalDateTime now = LocalDateTime.now();

        // ============================================================
        // CƠ CHẾ KIỂM DUYỆT 2 NHÁNH (DUAL-TRACK PRODUCT MODERATION):
        // 1. Nhánh BẮT BUỘC ADMIN KIỂM DUYỆT (PENDING_APPROVAL):
        //    Nếu tên hoặc mô tả chứa từ khóa nghi vấn liên quan đến THUỐC, DƯỢC PHẨM,
        //    Y TẾ, CHỮA BỆNH, THỰC PHẨM CHỨC NĂNG, AN TOÀN SỨC KHỎE NGƯỜI DÙNG
        //    -> Chuyển sang PENDING_APPROVAL, gán cờ cảnh báo rủi ro an toàn và CHỜ ADMIN PHÊ DUYỆT.
        // 2. Nhánh BOT TỰ ĐỘNG PHÊ DUYỆT (ACTIVE):
        //    Nếu là mặt hàng thông thường (quần áo, đồ gia dụng, nông sản an toàn...)
        //    đạt chuẩn thông tin -> BOT AI tự động phê duyệt thông qua ngay lập tức.
        // 3. Bản nháp (INACTIVE): Nếu người bán chủ động chọn lưu nháp.
        // ============================================================
        ProductStatus initialStatus;
        String moderatedBy = null;
        String moderationNote = null;

        if (request.status() == ProductStatus.INACTIVE) {
            initialStatus = ProductStatus.INACTIVE;
            moderationNote = "Bản nháp lưu tạm của Người bán";
        } else {
            initialStatus = ProductStatus.PENDING_APPROVAL;
            moderatedBy = null;
            if (isHealthOrSafetyRisk(request.name(), request.description())) {
                moderationNote = "Cảnh báo rủi ro sức khỏe/y tế: Phát hiện yếu tố hoặc từ khóa liên quan đến dược phẩm, thuốc hoặc an toàn người dùng. Yêu cầu Quản trị viên trực tiếp thẩm định giấy phép & chất lượng trước khi mở bán.";
                log.warn("Sản phẩm mới [{}] chứa từ khóa sức khỏe/thuốc/an toàn. Chuyển vào hàng đợi chờ Quản trị viên duyệt.", request.name());
            } else {
                moderationNote = "Sản phẩm mới chờ Quản trị viên kiểm duyệt thông tin & hình ảnh trước khi mở bán.";
                log.info("Sản phẩm mới [{}] được chuyển vào hàng đợi chờ Quản trị viên duyệt (PENDING_APPROVAL).", request.name());
            }
        }

        String effectiveStoreId = request.storeId();
        if (storeDAO != null) {
            if (effectiveStoreId == null || !storeDAO.existsById(effectiveStoreId)) {
                java.util.Optional<com.example.webchicken.modules.shop.model.entity.StoreEntity> fb =
                        storeDAO.findById("s0000000-0000-0000-0000-000000000001");
                if (fb.isPresent()) {
                    effectiveStoreId = fb.get().getId();
                } else {
                    java.util.List<com.example.webchicken.modules.shop.model.entity.StoreEntity> any = storeDAO.findAll(1, 1);
                    if (!any.isEmpty()) {
                        effectiveStoreId = any.get(0).getId();
                    }
                }
            }
        }

        ProductEntity product = new ProductEntity(
                productId,
                effectiveStoreId,
                request.categoryId(),
                request.name(),
                request.description(),
                initialStatus,
                now,
                now
        );
        product.setModeratedBy(moderatedBy);
        product.setModerationNote(moderationNote);
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
                product.getModeratedBy(),
                product.getModerationNote(),
                savedImages,
                savedVariants,
                0.0,
                0,
                0,
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
                product.getModeratedBy(),
                product.getModerationNote(),
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
        return reviewProduct(id, newStatus, rejectionReason, "ADMIN", null);
    }

    @Override
    public ProductDetailResponse reviewProduct(String id, ProductStatus newStatus, String rejectionReason, String reviewerName, String moderationNote) {
        ProductEntity product = productDAO.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy sản phẩm với id: " + id));

        product.setStatus(newStatus);
        String finalReviewer = (reviewerName != null && !reviewerName.isBlank()) ? reviewerName.trim() : "ADMIN";

        if (newStatus == ProductStatus.ACTIVE) {
            product.setRejectionReason(null);
            product.setModeratedBy(finalReviewer.startsWith("ADMIN") ? finalReviewer : "ADMIN: " + finalReviewer);
            product.setModerationNote(moderationNote != null && !moderationNote.isBlank()
                    ? moderationNote.trim()
                    : "Đã được Quản trị viên kiểm tra hồ sơ, giấy chứng nhận an toàn và phê duyệt mở bán");
            log.info("Sản phẩm [{}] đã được Quản trị viên [{}] phê duyệt mở bán.", id, product.getModeratedBy());
        } else if (newStatus == ProductStatus.INACTIVE || newStatus == ProductStatus.PENDING_APPROVAL) {
            if (rejectionReason != null && !rejectionReason.isBlank()) {
                product.setRejectionReason(rejectionReason.trim());
            }
            product.setModeratedBy(finalReviewer.startsWith("ADMIN") ? finalReviewer : "ADMIN: " + finalReviewer);
            product.setModerationNote("Bị Quản trị viên từ chối: " + (rejectionReason != null ? rejectionReason.trim() : "Không đạt tiêu chuẩn kiểm duyệt an toàn"));
            log.info("Sản phẩm [{}] đã bị Quản trị viên [{}] từ chối. Lý do: {}", id, product.getModeratedBy(), product.getRejectionReason());
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
                p.getModeratedBy(),
                p.getModerationNote(),
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
