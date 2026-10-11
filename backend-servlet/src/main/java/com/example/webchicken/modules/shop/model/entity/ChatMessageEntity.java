package com.example.webchicken.modules.shop.model.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Thực thể lưu trữ tin nhắn giao tiếp giữa Khách hàng và Người bán (Customer & Seller Chat).
 */
@Entity
@Table(name = "chat_messages")
public class ChatMessageEntity {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "store_id", length = 36, nullable = false)
    private String storeId;

    @Column(name = "customer_id", length = 36, nullable = false)
    private String customerId;

    @Column(name = "sender_type", length = 20, nullable = false)
    private String senderType; // 'CUSTOMER' hoặc 'SELLER'

    @Column(name = "sender_id", length = 36, nullable = false)
    private String senderId;

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "product_id", length = 36)
    private String productId;

    @Column(name = "product_name", length = 255)
    private String productName;

    @Column(name = "product_image", length = 500)
    private String productImage;

    @Column(name = "product_price_minor")
    private Long productPriceMinor;

    @Column(name = "is_read", nullable = false)
    private boolean isRead = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public ChatMessageEntity() {
    }

    public ChatMessageEntity(String id, String storeId, String customerId, String senderType, String senderId, String content) {
        this.id = id;
        this.storeId = storeId;
        this.customerId = customerId;
        this.senderType = senderType;
        this.senderId = senderId;
        this.content = content;
        this.isRead = false;
        this.createdAt = LocalDateTime.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getStoreId() {
        return storeId;
    }

    public void setStoreId(String storeId) {
        this.storeId = storeId;
    }

    public String getCustomerId() {
        return customerId;
    }

    public void setCustomerId(String customerId) {
        this.customerId = customerId;
    }

    public String getSenderType() {
        return senderType;
    }

    public void setSenderType(String senderType) {
        this.senderType = senderType;
    }

    public String getSenderId() {
        return senderId;
    }

    public void setSenderId(String senderId) {
        this.senderId = senderId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getProductId() {
        return productId;
    }

    public void setProductId(String productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getProductImage() {
        return productImage;
    }

    public void setProductImage(String productImage) {
        this.productImage = productImage;
    }

    public Long getProductPriceMinor() {
        return productPriceMinor;
    }

    public void setProductPriceMinor(Long productPriceMinor) {
        this.productPriceMinor = productPriceMinor;
    }

    public boolean isRead() {
        return isRead;
    }

    public void setRead(boolean read) {
        isRead = read;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
