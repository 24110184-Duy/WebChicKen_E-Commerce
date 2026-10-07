-- ============================================================
-- V010: Tăng cường bảng Feedback To Admins (TASK-69)
-- Bổ sung trạng thái xử lý, nội dung phúc đáp của Admin và người giải quyết
-- ============================================================

ALTER TABLE feedback_to_admins ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'PENDING';
ALTER TABLE feedback_to_admins ADD COLUMN IF NOT EXISTS admin_response TEXT NULL;
ALTER TABLE feedback_to_admins ADD COLUMN IF NOT EXISTS resolved_by VARCHAR(50) NULL;

-- Đánh chỉ mục tối ưu truy vấn danh sách phản hồi của Seller và Admin
CREATE INDEX idx_feedback_user_id ON feedback_to_admins(user_id);
CREATE INDEX idx_feedback_status ON feedback_to_admins(status);
CREATE INDEX idx_feedback_created_at ON feedback_to_admins(created_at);
