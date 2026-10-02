package com.example.webchicken.modules.shop.model.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Ánh xạ bảng {@code stores}.
 * Đại diện cho gian hàng của người bán trên sàn thương mại điện tử.
 */
@Entity
@Table(name = "stores")
public class StoreEntity {

    @Id
    @Column(name = "id", length = 36, nullable = false, updatable = false)
    private String id;

    @Column(name = "store_name", length = 100, nullable = false)
    private String storeName;

    @Column(name = "store_type", length = 20, nullable = false)
    private String storeType; // SELLER, BUYER, ADMIN

    @Column(name = "seller_id", length = 36, nullable = false)
    private String sellerId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public StoreEntity() {}

    public StoreEntity(String id, String storeName, String storeType, String sellerId, LocalDateTime createdAt) {
        this.id = id;
        this.storeName = storeName;
        this.storeType = storeType;
        this.sellerId = sellerId;
        this.createdAt = createdAt;
    }

    // ── Getters / Setters ────────────────────────────────────────────────────
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getStoreName() { return storeName; }
    public void setStoreName(String storeName) { this.storeName = storeName; }

    public String getStoreType() { return storeType; }
    public void setStoreType(String storeType) { this.storeType = storeType; }

    public String getSellerId() { return sellerId; }
    public void setSellerId(String sellerId) { this.sellerId = sellerId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
