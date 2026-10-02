package com.example.webchicken.modules.catalog.model.entity;

import jakarta.persistence.*;

/**
 * Ánh xạ bảng {@code product_images}.
 * Lưu trữ danh sách hình ảnh bổ sung hoặc chi tiết cho sản phẩm.
 */
@Entity
@Table(name = "product_images")
public class ProductImageEntity {

    @Id
    @Column(name = "id", length = 36, nullable = false, updatable = false)
    private String id;

    @Column(name = "product_id", length = 36, nullable = false)
    private String productId;

    @Column(name = "image_url", length = 500, nullable = false)
    private String imageUrl;

    public ProductImageEntity() {}

    public ProductImageEntity(String id, String productId, String imageUrl) {
        this.id = id;
        this.productId = productId;
        this.imageUrl = imageUrl;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}
