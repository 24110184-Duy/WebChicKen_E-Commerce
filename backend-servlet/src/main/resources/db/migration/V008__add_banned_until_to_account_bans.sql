-- ============================================================
-- V008: Bổ sung thời hạn cấm, người thực hiện cấm, và thời điểm mở khóa (PostgreSQL Compatible)
-- TASK-66: Quản lý người dùng và Khóa / Mở khóa tài khoản
-- ============================================================

ALTER TABLE account_bans
    ADD COLUMN IF NOT EXISTS banned_until TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS banned_by CHAR(36) NULL,
    ADD COLUMN IF NOT EXISTS unbanned_at TIMESTAMP NULL;

CREATE INDEX IF NOT EXISTS idx_account_bans_user_active ON account_bans(user_id, unbanned_at);
