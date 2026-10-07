-- ============================================================
-- V007: Thêm lý do từ chối kiểm duyệt cho sản phẩm (Product Moderation)
-- TASK-65: Backoffice Admin - Product Moderation
-- ============================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(500) NULL;
ALTER TABLE products ADD KEY IF NOT EXISTS idx_products_status (status);
