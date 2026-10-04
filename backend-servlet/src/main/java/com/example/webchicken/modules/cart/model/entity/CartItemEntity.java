package com.example.webchicken.modules.cart.model.entity;

import jakarta.persistence.*;

/**
 * Ánh xạ bảng {@code cart_items}.
 * Đại diện cho một dòng mặt hàng (sản phẩm và biến thể SKU) trong giỏ hàng.
 */
@Entity
@Table(name = "cart_items")
public class CartItemEntity {

    @Id
    @Column(name = "id", length = 36, nullable = false, updatable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cart_id", nullable = false)
    private CartEntity cart;

    @Column(name = "product_id", length = 36, nullable = false)
    private String productId;

    @Column(name = "variant_id", length = 36)
    private String variantId;

    @Column(name = "quantity", nullable = false)
    private int quantity = 1;

    public CartItemEntity() {}

    public CartItemEntity(String id, CartEntity cart, String productId, String variantId, int quantity) {
        this.id = id;
        this.cart = cart;
        this.productId = productId;
        this.variantId = variantId;
        this.quantity = quantity;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public CartEntity getCart() { return cart; }
    public void setCart(CartEntity cart) { this.cart = cart; }

    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }

    public String getVariantId() { return variantId; }
    public void setVariantId(String variantId) { this.variantId = variantId; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
}
