package com.example.webchicken.modules.order.model.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "order_items")
public class OrderItemEntity {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "order_id", length = 36, nullable = false)
    private String orderId;

    @Column(name = "product_id", length = 36, nullable = false)
    private String productId;

    @Column(name = "variant_id", length = 36)
    private String variantId;

    @Column(name = "product_name", length = 255)
    private String productName;

    @Column(name = "variant_name", length = 255)
    private String variantName;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "quantity", nullable = false)
    private int quantity;

    @Column(name = "unit_price_at_purchase_minor", nullable = false)
    private long unitPriceAtPurchaseMinor;

    public OrderItemEntity() {
    }

    public OrderItemEntity(String id, String orderId, String productId, String variantId,
                           String productName, String variantName, String imageUrl,
                           int quantity, long unitPriceAtPurchaseMinor) {
        this.id = id;
        this.orderId = orderId;
        this.productId = productId;
        this.variantId = variantId;
        this.productName = productName;
        this.variantName = variantName;
        this.imageUrl = imageUrl;
        this.quantity = quantity;
        this.unitPriceAtPurchaseMinor = unitPriceAtPurchaseMinor;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getProductId() {
        return productId;
    }

    public void setProductId(String productId) {
        this.productId = productId;
    }

    public String getVariantId() {
        return variantId;
    }

    public void setVariantId(String variantId) {
        this.variantId = variantId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getVariantName() {
        return variantName;
    }

    public void setVariantName(String variantName) {
        this.variantName = variantName;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public long getUnitPriceAtPurchaseMinor() {
        return unitPriceAtPurchaseMinor;
    }

    public void setUnitPriceAtPurchaseMinor(long unitPriceAtPurchaseMinor) {
        this.unitPriceAtPurchaseMinor = unitPriceAtPurchaseMinor;
    }
}
