-- ============================================================
-- V010: Tăng cường bảng Feedback To Admins (PostgreSQL Compatible)
-- TASK-69: Shop & Feedback
-- ============================================================

ALTER TABLE feedback_to_admins ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'PENDING';
ALTER TABLE feedback_to_admins ADD COLUMN IF NOT EXISTS admin_response TEXT NULL;
ALTER TABLE feedback_to_admins ADD COLUMN IF NOT EXISTS resolved_by VARCHAR(50) NULL;

CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback_to_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback_to_admins(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback_to_admins(created_at);
