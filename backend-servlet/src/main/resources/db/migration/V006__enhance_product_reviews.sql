-- ============================================================
-- V006: Tăng cường bảng product_reviews (Review & Rating Module) (PostgreSQL Compatible)
-- ============================================================

ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS order_id CHAR(36) NULL;
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS order_item_id CHAR(36) NULL;
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS media_urls JSON NULL;
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS seller_reply TEXT NULL;
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS seller_reply_at TIMESTAMP NULL;
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'APPROVED';
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS helpful_count INT NOT NULL DEFAULT 0;
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS uk_reviews_user_order_item ON product_reviews (user_id, order_item_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON product_reviews (order_id);
