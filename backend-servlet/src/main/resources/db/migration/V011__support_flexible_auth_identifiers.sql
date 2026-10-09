-- ============================================================
-- V011: Hỗ trợ đăng ký và đăng nhập linh hoạt bằng 1 trong 3:
-- Username, Email hoặc Số điện thoại
-- ============================================================

-- 1. Bổ sung cột username vào bảng users
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100);

-- 2. Đảm bảo username là UNIQUE (cho phép NULL)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uk_users_username'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT uk_users_username UNIQUE (username);
    END IF;
END $$;

-- 3. Cho phép email NULLABLE để người dùng có thể đăng ký chỉ bằng Phone hoặc Username
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- 4. Tạo partial unique index cho phone (chỉ unique khi phone không rỗng)
CREATE UNIQUE INDEX IF NOT EXISTS uk_users_phone ON users(phone) WHERE phone IS NOT NULL AND phone != '';
