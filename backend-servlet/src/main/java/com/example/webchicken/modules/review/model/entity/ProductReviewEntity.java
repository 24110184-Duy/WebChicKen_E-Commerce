package com.example.webchicken.modules.review.model.entity;

import com.example.webchicken.modules.review.model.enums.ReviewStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity ánh xạ bảng product_reviews (TASK-56).
 * Chuẩn Jakarta Persistence theo ARCHITECTURE.md 2.2 và CODE_PRINCIPLES.md 1.4.
 */
@Entity
@Table(name = "product_reviews")
public class ProductReviewEntity {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "user_id", length = 36, nullable = false)
    private String userId;

    @Column(name = "order_id", length = 36, nullable = false)
    private String orderId;

    @Column(name = "order_item_id", length = 36, nullable = false)
    private String orderItemId;

    @Column(name = "product_id", length = 36, nullable = false)
    private String productId;

    @Column(name = "rating", nullable = false)
    private int rating;

    @Column(name = "comment", columnDefinition = "TEXT", nullable = false)
    private String comment;

    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(name = "media_urls", columnDefinition = "JSON")
    private String mediaUrls;

    @Column(name = "seller_reply", columnDefinition = "TEXT")
    private String sellerReply;

    @Column(name = "seller_reply_at")
    private LocalDateTime sellerReplyAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private ReviewStatus status = ReviewStatus.APPROVED;

    @Column(name = "helpful_count", nullable = false)
    private int helpfulCount = 0;

    @Column(name = "edited_by", length = 100)
    private String editedBy;

    @Column(name = "post_at")
    private LocalDateTime postAt = LocalDateTime.now();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public ProductReviewEntity() {
    }

    public ProductReviewEntity(String id, String userId, String orderId, String orderItemId,
                               String productId, int rating, String comment) {
        this.id = id;
        this.userId = userId;
        this.orderId = orderId;
        this.orderItemId = orderItemId;
        this.productId = productId;
        this.rating = rating;
        this.comment = comment;
        this.status = ReviewStatus.APPROVED;
        this.postAt = LocalDateTime.now();
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
        if (postAt == null) postAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public String getOrderItemId() { return orderItemId; }
    public void setOrderItemId(String orderItemId) { this.orderItemId = orderItemId; }

    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }

    public int getRating() { return rating; }
    public void setRating(int rating) { this.rating = rating; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public String getMediaUrls() { return mediaUrls; }
    public void setMediaUrls(String mediaUrls) { this.mediaUrls = mediaUrls; }

    public String getSellerReply() { return sellerReply; }
    public void setSellerReply(String sellerReply) { this.sellerReply = sellerReply; }

    public LocalDateTime getSellerReplyAt() { return sellerReplyAt; }
    public void setSellerReplyAt(LocalDateTime sellerReplyAt) { this.sellerReplyAt = sellerReplyAt; }

    public ReviewStatus getStatus() { return status; }
    public void setStatus(ReviewStatus status) { this.status = status; }

    public int getHelpfulCount() { return helpfulCount; }
    public void setHelpfulCount(int helpfulCount) { this.helpfulCount = helpfulCount; }

    public String getEditedBy() { return editedBy; }
    public void setEditedBy(String editedBy) { this.editedBy = editedBy; }

    public LocalDateTime getPostAt() { return postAt; }
    public void setPostAt(LocalDateTime postAt) { this.postAt = postAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
