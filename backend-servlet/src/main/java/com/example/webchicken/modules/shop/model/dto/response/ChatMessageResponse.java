package com.example.webchicken.modules.shop.model.dto.response;

import com.example.webchicken.modules.shop.model.entity.ChatMessageEntity;

import java.time.format.DateTimeFormatter;

public class ChatMessageResponse {
    private String id;
    private String storeId;
    private String customerId;
    private String senderType; // 'CUSTOMER' hoặc 'SELLER'
    private String senderId;
    private String content;
    private String productId;
    private String productName;
    private String productImage;
    private Long productPriceMinor;
    private boolean isRead;
    private String createdAt;

    public ChatMessageResponse() {
    }

    public static ChatMessageResponse fromEntity(ChatMessageEntity entity) {
        if (entity == null) return null;
        ChatMessageResponse res = new ChatMessageResponse();
        res.setId(entity.getId());
        res.setStoreId(entity.getStoreId());
        res.setCustomerId(entity.getCustomerId());
        res.setSenderType(entity.getSenderType());
        res.setSenderId(entity.getSenderId());
        res.setContent(entity.getContent());
        res.setProductId(entity.getProductId());
        res.setProductName(entity.getProductName());
        res.setProductImage(entity.getProductImage());
        res.setProductPriceMinor(entity.getProductPriceMinor());
        res.setRead(entity.isRead());
        if (entity.getCreatedAt() != null) {
            res.setCreatedAt(entity.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        }
        return res;
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

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
}
