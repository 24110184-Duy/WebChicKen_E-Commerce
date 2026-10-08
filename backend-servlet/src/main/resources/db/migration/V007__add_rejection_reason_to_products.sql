-- ============================================================
-- V007: Thêm lý do từ chối kiểm duyệt cho sản phẩm (PostgreSQL Compatible)
-- TASK-65: Backoffice Admin - Product Moderation
-- ============================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(500) NULL;
CREATE INDEX IF NOT EXISTS idx_products_status ON products (status);
