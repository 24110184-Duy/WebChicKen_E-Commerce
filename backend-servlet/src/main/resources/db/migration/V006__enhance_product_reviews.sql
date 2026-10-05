-- ============================================================
-- V006: Tăng cường bảng product_reviews (Review & Rating Module)
-- ============================================================

ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS order_id CHAR(36) NULL;
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS order_item_id CHAR(36) NULL;
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS media_urls JSON NULL;
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS seller_reply TEXT NULL;
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS seller_reply_at DATETIME NULL;
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'APPROVED';
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS helpful_count INT NOT NULL DEFAULT 0;
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE product_reviews ADD UNIQUE KEY uk_reviews_user_order_item (user_id, order_item_id);
ALTER TABLE product_reviews ADD KEY idx_reviews_order_id (order_id);
