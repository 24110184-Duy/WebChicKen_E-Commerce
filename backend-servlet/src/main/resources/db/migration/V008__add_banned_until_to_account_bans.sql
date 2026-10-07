-- ============================================================
-- V008: Bổ sung thời hạn cấm, người thực hiện cấm, và thời điểm mở khóa cho bảng account_bans
-- TASK-66: Quản lý người dùng và Khóa / Mở khóa tài khoản
-- ============================================================

ALTER TABLE account_bans
    ADD COLUMN banned_until DATETIME NULL AFTER banned_at,
    ADD COLUMN banned_by CHAR(36) NULL AFTER banned_until,
    ADD COLUMN unbanned_at DATETIME NULL AFTER banned_by;

CREATE INDEX idx_account_bans_user_active ON account_bans(user_id, unbanned_at);
