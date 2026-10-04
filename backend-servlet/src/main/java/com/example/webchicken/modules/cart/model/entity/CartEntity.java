package com.example.webchicken.modules.cart.model.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Ánh xạ bảng {@code carts}.
 * Đại diện cho Giỏ hàng của một Khách hàng (Customer).
 */
@Entity
@Table(name = "carts")
public class CartEntity {

    @Id
    @Column(name = "id", length = 36, nullable = false, updatable = false)
    private String id;

    @Column(name = "customer_id", length = 36, nullable = false, unique = true)
    private String customerId;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<CartItemEntity> items = new ArrayList<>();

    public CartEntity() {}

    public CartEntity(String id, String customerId) {
        this.id = id;
        this.customerId = customerId;
        this.updatedAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<CartItemEntity> getItems() { return items; }
    public void setItems(List<CartItemEntity> items) { this.items = items; }

    public void addItem(CartItemEntity item) {
        items.add(item);
        item.setCart(this);
        this.updatedAt = LocalDateTime.now();
    }

    public void removeItem(CartItemEntity item) {
        items.remove(item);
        item.setCart(null);
        this.updatedAt = LocalDateTime.now();
    }
}
