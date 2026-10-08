-- ============================================================
-- V004: Tăng cường bảng Vouchers, Orders, Order Items và Hủy đơn hàng (PostgreSQL Compatible)
-- ============================================================

-- Bổ sung các trường quản lý voucher nâng cao
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS title VARCHAR(255) NULL;
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS description VARCHAR(255) NULL;
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS store_id CHAR(36) NULL;
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS usage_limit INT NOT NULL DEFAULT 1000;
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS used_count INT NOT NULL DEFAULT 0;

-- Bổ sung trường quản lý đơn hàng đa shop (Multi-shop partition)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_code VARCHAR(50) NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_group_id CHAR(36) NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS store_id CHAR(36) NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_fee_minor BIGINT NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount_minor BIGINT NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS voucher_id CHAR(36) NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(100) NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS recipient_phone VARCHAR(20) NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address TEXT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) NOT NULL DEFAULT 'COD';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS note VARCHAR(500) NULL;

-- Bổ sung chi tiết biến thể và snapshot sản phẩm trong order_items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id CHAR(36) NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_name VARCHAR(255) NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_name VARCHAR(255) NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) NULL;

-- Bổ sung thông tin chi tiết hủy đơn
ALTER TABLE order_cancellations ADD COLUMN IF NOT EXISTS reason VARCHAR(500) NOT NULL DEFAULT 'Customer cancelled';
ALTER TABLE order_cancellations ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(50) NOT NULL DEFAULT 'CUSTOMER';
