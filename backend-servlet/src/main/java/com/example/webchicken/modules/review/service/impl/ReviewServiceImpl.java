package com.example.webchicken.modules.review.service.impl;

import com.example.webchicken.common.enums.OrderStatus;
import com.example.webchicken.common.exception.AuthorizationException;
import com.example.webchicken.common.exception.ConflictException;
import com.example.webchicken.common.exception.NotFoundException;
import com.example.webchicken.common.exception.ValidationException;
import com.example.webchicken.modules.identity.dao.UserDAO;
import com.example.webchicken.modules.identity.model.entity.UserEntity;
import com.example.webchicken.modules.order.dao.OrderDAO;
import com.example.webchicken.modules.order.dao.OrderItemDAO;
import com.example.webchicken.modules.order.model.entity.OrderEntity;
import com.example.webchicken.modules.order.model.entity.OrderItemEntity;
import com.example.webchicken.modules.review.dao.ReviewDAO;
import com.example.webchicken.modules.review.model.dto.request.CreateReviewRequest;
import com.example.webchicken.modules.review.model.dto.request.UpdateReviewRequest;
import com.example.webchicken.modules.review.model.dto.response.ReviewResponse;
import com.example.webchicken.modules.review.model.dto.response.ReviewSummaryResponse;
import com.example.webchicken.modules.review.model.entity.ProductReviewEntity;
import com.example.webchicken.modules.review.model.enums.ReviewStatus;
import com.example.webchicken.modules.review.service.ReviewService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Triển khai ReviewService cho đánh giá & phản hồi sản phẩm (TASK-56).
 * Tuân thủ nghiêm ngặt ARCHITECTURE.md 2.3.7, 3.5.11 và CODE_PRINCIPLES.md SEC-04.
 */
public class ReviewServiceImpl implements ReviewService {

    private static final Logger log = LoggerFactory.getLogger(ReviewServiceImpl.class);
    private static final int MAX_COMMENT_LENGTH = 20000;
    private static final int MAX_COMMENT_WORDS = 2000;
    private static final int MAX_MEDIA_ITEMS = 10;
    private static final int EDIT_WINDOW_DAYS = 30;

    private final ReviewDAO reviewDAO;
    private final OrderDAO orderDAO;
    private final OrderItemDAO orderItemDAO;
    private final UserDAO userDAO;
    private final ObjectMapper objectMapper;

    public ReviewServiceImpl(ReviewDAO reviewDAO, OrderDAO orderDAO, OrderItemDAO orderItemDAO, UserDAO userDAO) {
        this.reviewDAO = Objects.requireNonNull(reviewDAO, "reviewDAO must not be null");
        this.orderDAO = Objects.requireNonNull(orderDAO, "orderDAO must not be null");
        this.orderItemDAO = Objects.requireNonNull(orderItemDAO, "orderItemDAO must not be null");
        this.userDAO = Objects.requireNonNull(userDAO, "userDAO must not be null");
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public ReviewResponse createReview(String userId, CreateReviewRequest request) {
        if (userId == null || userId.isBlank()) {
            throw new AuthorizationException("Authentication required to submit a review.");
        }
        if (request == null) {
            throw new ValidationException("Review request body cannot be null.");
        }

        // 1. Kiểm tra rating hợp lệ (1 đến 5 sao)
        if (request.rating() < 1 || request.rating() > 5) {
            throw new ValidationException("Rating must be an integer between 1 and 5 stars.");
        }

        String comment = sanitizeComment(request.comment());
        if (comment.isBlank()) {
            throw new ValidationException("Review comment cannot be empty.");
        }
        if (comment.length() > MAX_COMMENT_LENGTH) {
            throw new ValidationException("Review comment exceeds maximum allowed length of " + MAX_COMMENT_LENGTH + " characters.");
        }
        long wordCount = Arrays.stream(comment.trim().split("\\s+")).filter(s -> !s.isEmpty()).count();
        if (wordCount > MAX_COMMENT_WORDS) {
            throw new ValidationException("Review comment exceeds maximum allowed limit of " + MAX_COMMENT_WORDS + " words.");
        }

        List<String> validatedMediaUrls = sanitizeMediaUrls(request.mediaUrls());

        // 2. Kiểm tra đơn hàng tồn tại và thuộc về chính buyer này
        if (request.orderId() == null || request.orderId().isBlank()) {
            throw new ValidationException("orderId is required.");
        }
        OrderEntity order = orderDAO.findById(request.orderId())
                .orElseThrow(() -> new NotFoundException("Order not found with id: " + request.orderId()));

        if (!userId.equals(order.getCustomerId())) {
            throw new AuthorizationException("You are not authorized to review an order belonging to another customer.");
        }

        // 3. ARCHITECTURE.md 2.3.7: Chỉ được review khi đơn hàng ở trạng thái DELIVERED
        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new ConflictException("ORDER_NOT_DELIVERED",
                    "Reviews are only permitted for delivered orders. Current order status: " + order.getStatus());
        }

        // 4. Kiểm tra orderItem hợp lệ và thuộc về đơn hàng này
        if (request.orderItemId() == null || request.orderItemId().isBlank()) {
            throw new ValidationException("orderItemId is required.");
        }
        OrderItemEntity orderItem = orderItemDAO.findById(request.orderItemId())
                .orElseThrow(() -> new NotFoundException("Order item not found with id: " + request.orderItemId()));

        if (!order.getId().equals(orderItem.getOrderId())) {
            throw new ValidationException("Order item [" + request.orderItemId() + "] does not belong to order [" + order.getId() + "].");
        }

        // Bảo vệ chống giả mạo sản phẩm (Product Spoofing): product_id phải khớp với mặt hàng đã mua
        if (request.productId() != null && !request.productId().isBlank() && !request.productId().equals(orderItem.getProductId())) {
            throw new ValidationException("Product ID does not match the purchased order item.");
        }
        String productId = orderItem.getProductId();

        // 5. Kiểm tra tính trùng lặp: Mỗi order_item chỉ được review 1 lần duy nhất
        if (reviewDAO.hasReviewed(userId, request.orderItemId())) {
            throw new ConflictException("REVIEW_ALREADY_EXISTS",
                    "You have already submitted a review for this purchased item.");
        }

        // 6. Xây dựng Entity và lưu vào DB (bảo vệ race condition khi nhiều request đồng thời)
        String reviewId = UUID.randomUUID().toString();
        ProductReviewEntity review = new ProductReviewEntity();
        review.setId(reviewId);
        review.setUserId(userId);
        review.setOrderId(order.getId());
        review.setOrderItemId(orderItem.getId());
        review.setProductId(productId);
        review.setRating(request.rating());
        review.setComment(comment);
        review.setMediaUrls(serializeMediaUrls(validatedMediaUrls));
        review.setStatus(ReviewStatus.APPROVED);
        review.setHelpfulCount(0);
        review.setPostAt(LocalDateTime.now());
        review.setCreatedAt(LocalDateTime.now());
        review.setUpdatedAt(LocalDateTime.now());

        try {
            reviewDAO.insert(review);
        } catch (Exception e) {
            String msg = (e.getMessage() != null) ? e.getMessage().toLowerCase() : "";
            Throwable cause = e.getCause();
            String causeMsg = (cause != null && cause.getMessage() != null) ? cause.getMessage().toLowerCase() : "";
            if (msg.contains("duplicate") || msg.contains("unique") || causeMsg.contains("duplicate") || causeMsg.contains("unique")) {
                throw new ConflictException("REVIEW_ALREADY_EXISTS",
                        "You have already submitted a review for this purchased item.");
            }
            log.error("Failed to insert review entity: {}", e.getMessage(), e);
            throw e;
        }

        log.info("Customer [{}] created review [{}] for product [{}] in order [{}] with rating [{}]",
                userId, reviewId, productId, order.getId(), request.rating());

        return mapToResponse(review);
    }

    @Override
    public ReviewResponse updateReview(String userId, String reviewId, UpdateReviewRequest request) {
        if (userId == null || userId.isBlank()) {
            throw new AuthorizationException("Authentication required.");
        }
        if (reviewId == null || reviewId.isBlank()) {
            throw new ValidationException("reviewId is required.");
        }
        if (request == null) {
            throw new ValidationException("Update request body cannot be null.");
        }

        ProductReviewEntity review = reviewDAO.findById(reviewId)
                .orElseThrow(() -> new NotFoundException("Review not found with id: " + reviewId));

        if (!userId.equals(review.getUserId())) {
            throw new AuthorizationException("You can only edit your own reviews.");
        }

        // API 3.5.11: 409 hết hạn sửa review (chỉ được sửa trong vòng EDIT_WINDOW_DAYS ngày)
        if (review.getCreatedAt() != null && review.getCreatedAt().isBefore(LocalDateTime.now().minusDays(EDIT_WINDOW_DAYS))) {
            throw new ConflictException("EDIT_WINDOW_EXPIRED",
                    "Review editing window has expired (maximum " + EDIT_WINDOW_DAYS + " days).");
        }

        if (request.rating() < 1 || request.rating() > 5) {
            throw new ValidationException("Rating must be an integer between 1 and 5 stars.");
        }

        String comment = sanitizeComment(request.comment());
        if (comment.isBlank()) {
            throw new ValidationException("Review comment cannot be empty.");
        }
        if (comment.length() > MAX_COMMENT_LENGTH) {
            throw new ValidationException("Review comment exceeds maximum allowed length of " + MAX_COMMENT_LENGTH + " characters.");
        }
        long wordCount = Arrays.stream(comment.trim().split("\\s+")).filter(s -> !s.isEmpty()).count();
        if (wordCount > MAX_COMMENT_WORDS) {
            throw new ValidationException("Review comment exceeds maximum allowed limit of " + MAX_COMMENT_WORDS + " words.");
        }

        review.setRating(request.rating());
        review.setComment(comment);
        if (request.mediaUrls() != null) {
            List<String> validatedMedia = sanitizeMediaUrls(request.mediaUrls());
            review.setMediaUrls(serializeMediaUrls(validatedMedia));
        }
        review.setEditedBy(userId);
        review.setUpdatedAt(LocalDateTime.now());

        reviewDAO.update(review);
        log.info("User [{}] updated review [{}]", userId, reviewId);

        return mapToResponse(review);
    }

    @Override
    public void deleteReview(String userId, String reviewId) {
        if (userId == null || userId.isBlank()) {
            throw new AuthorizationException("Authentication required.");
        }
        ProductReviewEntity review = reviewDAO.findById(reviewId)
                .orElseThrow(() -> new NotFoundException("Review not found with id: " + reviewId));

        if (!userId.equals(review.getUserId())) {
            throw new AuthorizationException("You can only delete your own reviews.");
        }

        reviewDAO.delete(reviewId);
        log.info("User [{}] deleted review [{}]", userId, reviewId);
    }

    @Override
    public List<ReviewResponse> getProductReviews(String productId, Integer ratingFilter, int page, int size) {
        if (productId == null || productId.isBlank()) {
            return List.of();
        }
        List<ProductReviewEntity> entities = reviewDAO.findByProductId(productId, ratingFilter, page, size);
        return entities.stream().map(this::mapToResponse).toList();
    }

    @Override
    public long countProductReviews(String productId, Integer ratingFilter) {
        if (productId == null || productId.isBlank()) return 0;
        return reviewDAO.countByProductId(productId, ratingFilter);
    }

    @Override
    public ReviewSummaryResponse getProductReviewSummary(String productId) {
        if (productId == null || productId.isBlank()) {
            return new ReviewSummaryResponse("", 0.0, 0, 0, 0, 0, 0, 0);
        }
        return reviewDAO.getReviewSummary(productId);
    }

    @Override
    public List<ReviewResponse> getMyReviews(String userId, int page, int size) {
        if (userId == null || userId.isBlank()) {
            return List.of();
        }
        List<ProductReviewEntity> entities = reviewDAO.findByUserId(userId, page, size);
        return entities.stream().map(this::mapToResponse).toList();
    }

    private ReviewResponse mapToResponse(ProductReviewEntity entity) {
        String userName = "Customer";
        String userAvatar = null;

        try {
            Optional<UserEntity> userOpt = userDAO.findById(entity.getUserId());
            if (userOpt.isPresent()) {
                UserEntity user = userOpt.get();
                userName = user.getFullName() != null ? user.getFullName() : "Customer";
                userAvatar = user.getLogoUrl();
            }
        } catch (Exception e) {
            log.warn("Could not fetch user details for review [{}]: {}", entity.getId(), e.getMessage());
        }

        return new ReviewResponse(
                entity.getId(),
                entity.getUserId(),
                userName,
                userAvatar,
                entity.getOrderId(),
                entity.getOrderItemId(),
                entity.getProductId(),
                entity.getRating(),
                entity.getComment(),
                deserializeMediaUrls(entity.getMediaUrls()),
                entity.getSellerReply(),
                entity.getSellerReplyAt(),
                entity.getStatus(),
                entity.getHelpfulCount(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    /**
     * SEC-04: Làm sạch nội dung chống XSS injection, giữ nguyên biểu thức toán học hợp lệ.
     */
    private String sanitizeComment(String raw) {
        if (raw == null) return "";
        String cleaned = raw;
        // 1. Loại bỏ các thẻ script, iframe, object, embed và nội dung bên trong
        while (cleaned.matches("(?i).*(<script|<iframe|<object|<embed).*")) {
            String prev = cleaned;
            cleaned = cleaned.replaceAll("(?i)<script[^>]*>[\\s\\S]*?</script>", "")
                    .replaceAll("(?i)<iframe[^>]*>[\\s\\S]*?</iframe>", "")
                    .replaceAll("(?i)<script[^>]*$?", "")
                    .replaceAll("(?i)<iframe[^>]*$?", "");
            if (cleaned.equals(prev)) {
                cleaned = cleaned.replaceAll("(?i)</?script[^>]*>?", "")
                        .replaceAll("(?i)</?iframe[^>]*>?", "");
                break;
            }
        }
        // 2. Loại bỏ các thẻ HTML có đóng: <letter ... > (không xóa < 100k vì sau < là khoảng trắng)
        cleaned = cleaned.replaceAll("(?i)</?[a-zA-Z][^>]*>", "");
        // 3. Loại bỏ các thẻ HTML chưa đóng ở cuối chuỗi: <letter ... (ví dụ: <img src=x onerror=...)
        cleaned = cleaned.replaceAll("(?i)</?[a-zA-Z][^<]*$", "");
        return cleaned.trim();
    }

    private List<String> sanitizeMediaUrls(List<String> mediaUrls) {
        if (mediaUrls == null || mediaUrls.isEmpty()) return List.of();
        if (mediaUrls.size() > MAX_MEDIA_ITEMS) {
            throw new ValidationException("Maximum " + MAX_MEDIA_ITEMS + " media items allowed per review.");
        }
        List<String> safeList = new ArrayList<>();
        for (String url : mediaUrls) {
            if (url == null || url.isBlank()) continue;
            String trimmed = url.trim();
            String lower = trimmed.toLowerCase();
            if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:")) {
                throw new ValidationException("Invalid media URL protocol: " + trimmed);
            }
            safeList.add(trimmed);
        }
        return safeList;
    }

    private String serializeMediaUrls(List<String> mediaUrls) {
        if (mediaUrls == null || mediaUrls.isEmpty()) return null;
        try {
            return objectMapper.writeValueAsString(mediaUrls);
        } catch (Exception e) {
            log.warn("Failed to serialize media URLs: {}", e.getMessage());
            return null;
        }
    }

    private List<String> deserializeMediaUrls(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }
}
