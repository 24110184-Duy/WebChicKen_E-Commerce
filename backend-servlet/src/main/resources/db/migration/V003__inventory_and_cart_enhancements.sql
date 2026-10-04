-- ============================================================
-- V003: Quản lý giữ kho (Inventory Reservation) & Giỏ hàng đa biến thể
-- ============================================================

-- Thêm cột reserved_quantity vào product_variants để theo dõi tồn kho đang giữ chỗ
ALTER TABLE product_variants ADD COLUMN reserved_quantity INT NOT NULL DEFAULT 0;

-- Bảng lưu trữ giữ kho có thời hạn (TTL)
CREATE TABLE IF NOT EXISTS stock_reservations (
    id          CHAR(36)     NOT NULL PRIMARY KEY,
    sku_id      CHAR(36)     NOT NULL,
    quantity    INT          NOT NULL,
    order_id    VARCHAR(100) NULL,
    status      ENUM('ACTIVE','COMMITTED','RELEASED','EXPIRED') NOT NULL DEFAULT 'ACTIVE',
    expires_at  DATETIME     NOT NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_stock_reservations_sku FOREIGN KEY (sku_id) REFERENCES product_variants(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Thêm cột variant_id vào cart_items để chọn chính xác biến thể (SKU)
ALTER TABLE cart_items ADD COLUMN variant_id CHAR(36) NULL;
ALTER TABLE cart_items ADD CONSTRAINT fk_cart_items_variants FOREIGN KEY (variant_id) REFERENCES product_variants(id);
