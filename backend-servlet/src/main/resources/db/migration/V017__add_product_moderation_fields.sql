-- ============================================================
-- V017: Bổ sung trường quản trị kiểm duyệt 2 luồng (Bot AI vs Admin) cho sản phẩm
-- TASK: Dual-track Product Moderation (Bot Auto-Approval & Health/Safety Admin Review)
-- ============================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS moderated_by VARCHAR(100) NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS moderation_note VARCHAR(500) NULL;

CREATE INDEX IF NOT EXISTS idx_products_moderated_by ON products(moderated_by);
