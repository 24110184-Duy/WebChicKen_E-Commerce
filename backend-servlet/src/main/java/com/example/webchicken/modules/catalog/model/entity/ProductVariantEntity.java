package com.example.webchicken.modules.catalog.model.entity;

import jakarta.persistence.*;

/**
 * Ánh xạ bảng {@code product_variants}.
 * Đại diện cho Biến thể sản phẩm (SKU - Stock Keeping Unit).
 * Tuân thủ quy tắc CUR-01: giá tiền luôn dùng long (minor unit), không dùng double/float.
 */
@Entity
@Table(name = "product_variants")
public class ProductVariantEntity {

    @Id
    @Column(name = "id", length = 36, nullable = false, updatable = false)
    private String id;

    @Column(name = "product_id", length = 36, nullable = false)
    private String productId;

    @Column(name = "attribute", length = 255, nullable = false)
    private String attribute; // e.g. "Color: Red, Size: XL"

    @Column(name = "base_price_minor", nullable = false)
    private long basePriceMinor = 0L;

    @Column(name = "stock_quantity", nullable = false)
    private int stockQuantity = 0;

    public ProductVariantEntity() {}

    public ProductVariantEntity(String id, String productId, String attribute, long basePriceMinor, int stockQuantity) {
        this.id = id;
        this.productId = productId;
        this.attribute = attribute;
        this.basePriceMinor = basePriceMinor;
        this.stockQuantity = stockQuantity;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }

    public String getAttribute() { return attribute; }
    public void setAttribute(String attribute) { this.attribute = attribute; }

    public long getBasePriceMinor() { return basePriceMinor; }
    public void setBasePriceMinor(long basePriceMinor) { this.basePriceMinor = basePriceMinor; }

    public int getStockQuantity() { return stockQuantity; }
    public void setStockQuantity(int stockQuantity) { this.stockQuantity = stockQuantity; }
}
