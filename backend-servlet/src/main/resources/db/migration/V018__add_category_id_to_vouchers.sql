-- ============================================================
-- V018: Bổ sung trường category_id cho bảng vouchers
-- Cho phép tạo Voucher áp dụng theo 1 Danh mục sản phẩm (Toàn sàn hoặc Của riêng Shop)
-- ============================================================

ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS category_id CHAR(36) NULL;

CREATE INDEX IF NOT EXISTS idx_vouchers_category_id ON vouchers(category_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_store_id ON vouchers(store_id);
