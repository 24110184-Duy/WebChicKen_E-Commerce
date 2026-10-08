-- ============================================================
-- V003: Quản lý giữ kho (Inventory Reservation) & Giỏ hàng đa biến thể (PostgreSQL Compatible)
-- ============================================================

-- Thêm cột reserved_quantity vào product_variants để theo dõi tồn kho đang giữ chỗ
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS reserved_quantity INT NOT NULL DEFAULT 0;

-- Bảng lưu trữ giữ kho có thời hạn (TTL)
CREATE TABLE IF NOT EXISTS stock_reservations (
    id          CHAR(36)     NOT NULL PRIMARY KEY,
    sku_id      CHAR(36)     NOT NULL,
    quantity    INT          NOT NULL,
    order_id    VARCHAR(100) NULL,
    status      VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    expires_at  TIMESTAMP    NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_stock_reservations_sku FOREIGN KEY (sku_id) REFERENCES product_variants(id)
);

-- Thêm cột variant_id vào cart_items để chọn chính xác biến thể (SKU)
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS variant_id CHAR(36) NULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_cart_items_variants') THEN
        ALTER TABLE cart_items ADD CONSTRAINT fk_cart_items_variants FOREIGN KEY (variant_id) REFERENCES product_variants(id);
    END IF;
END $$;
