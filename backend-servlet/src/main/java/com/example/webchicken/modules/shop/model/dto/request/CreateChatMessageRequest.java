package com.example.webchicken.modules.shop.model.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class CreateChatMessageRequest {
    private String storeId;
    private String customerId; // Optional khi người gửi là Buyer (server tự lấy từ AuthenticatedUser)
    private String content;
    private String productId;
    private String productName;
    private String productImage;
    private Long productPriceMinor;

    public CreateChatMessageRequest() {
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
}
