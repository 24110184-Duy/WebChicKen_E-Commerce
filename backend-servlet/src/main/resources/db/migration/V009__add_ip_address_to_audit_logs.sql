-- ============================================================
-- V009: Bổ sung địa chỉ IP cho bảng audit_logs
-- TASK-67: Admin Audit Logging System
-- ============================================================

ALTER TABLE audit_logs
    ADD COLUMN ip_address VARCHAR(45) NULL AFTER detail;

CREATE INDEX idx_audit_logs_admin_created ON audit_logs(admin_id, created_at);
CREATE INDEX idx_audit_logs_target ON audit_logs(target_type, target_id);
