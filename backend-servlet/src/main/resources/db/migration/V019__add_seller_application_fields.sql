-- ============================================================
-- V019: Bổ sung các trường thông tin thẩm định hồ sơ người bán (Seller Application)
-- Bao gồm thông tin chủ hộ/doanh nghiệp, liên hệ, địa chỉ kinh doanh, và chứng nhận pháp lý
-- ============================================================

ALTER TABLE seller_applications ADD COLUMN IF NOT EXISTS owner_name VARCHAR(100) NULL;
ALTER TABLE seller_applications ADD COLUMN IF NOT EXISTS phone VARCHAR(20) NULL;
ALTER TABLE seller_applications ADD COLUMN IF NOT EXISTS email VARCHAR(255) NULL;
ALTER TABLE seller_applications ADD COLUMN IF NOT EXISTS farm_location VARCHAR(500) NULL;
ALTER TABLE seller_applications ADD COLUMN IF NOT EXISTS farm_type VARCHAR(100) NULL;
ALTER TABLE seller_applications ADD COLUMN IF NOT EXISTS tax_code VARCHAR(50) NULL;
ALTER TABLE seller_applications ADD COLUMN IF NOT EXISTS certificate_type VARCHAR(100) NULL;
ALTER TABLE seller_applications ADD COLUMN IF NOT EXISTS certificate_number VARCHAR(100) NULL;
ALTER TABLE seller_applications ADD COLUMN IF NOT EXISTS certificate_expiry VARCHAR(50) NULL;
ALTER TABLE seller_applications ADD COLUMN IF NOT EXISTS daily_capacity VARCHAR(100) NULL;

-- Đồng bộ dữ liệu cho các hồ sơ đăng ký đã có từ bảng users và sellers
UPDATE seller_applications sa
SET 
    owner_name = COALESCE(sa.owner_name, u.full_name, u.username),
    phone = COALESCE(sa.phone, u.phone),
    email = COALESCE(sa.email, u.email),
    farm_type = COALESCE(sa.farm_type, 'Thương mại điện tử & Bán lẻ'),
    tax_code = COALESCE(sa.tax_code, (SELECT s.tax_code FROM sellers s WHERE s.id = sa.user_id LIMIT 1)),
    certificate_type = COALESCE(sa.certificate_type, 'ĐKKD Hợp Lệ'),
    certificate_number = COALESCE(sa.certificate_number, 'DKKD-2025-01'),
    certificate_expiry = COALESCE(sa.certificate_expiry, 'Không thời hạn'),
    daily_capacity = COALESCE(sa.daily_capacity, 'Cung ứng theo ngày')
FROM users u
WHERE sa.user_id = u.id;

UPDATE seller_applications sa
SET farm_location = (
    SELECT CONCAT(a.address_line1, ', ', a.district, ', ', a.city)
    FROM addresses a
    WHERE a.user_id = sa.user_id
    ORDER BY a.is_default DESC, a.created_at DESC
    LIMIT 1
)
WHERE sa.farm_location IS NULL;
