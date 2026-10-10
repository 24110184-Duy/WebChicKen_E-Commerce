-- ============================================================
-- V014: Ràng buộc duy nhất 1 giỏ hàng cho mỗi khách hàng (PostgreSQL Compatible)
-- ============================================================

-- 1. Dọn dẹp các giỏ hàng trùng lặp trước khi thêm ràng buộc UNIQUE
DO $$
DECLARE
    rec RECORD;
    primary_cart_id CHAR(36);
BEGIN
    FOR rec IN 
        SELECT customer_id 
        FROM carts 
        GROUP BY customer_id 
        HAVING COUNT(*) > 1
    LOOP
        -- Giữ lại giỏ hàng có thời gian cập nhật mới nhất
        SELECT id INTO primary_cart_id 
        FROM carts 
        WHERE customer_id = rec.customer_id 
        ORDER BY updated_at DESC 
        LIMIT 1;

        -- Chuyển toàn bộ sản phẩm trong các giỏ cũ sang giỏ chính
        UPDATE cart_items 
        SET cart_id = primary_cart_id 
        WHERE cart_id IN (
            SELECT id FROM carts 
            WHERE customer_id = rec.customer_id AND id <> primary_cart_id
        );

        -- Xóa các giỏ hàng bị trùng lặp
        DELETE FROM carts 
        WHERE customer_id = rec.customer_id AND id <> primary_cart_id;
    END LOOP;
END $$;

-- 2. Thêm ràng buộc UNIQUE trên cột customer_id để chống Race Condition vĩnh viễn
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_carts_customer_id'
    ) THEN
        ALTER TABLE carts ADD CONSTRAINT uq_carts_customer_id UNIQUE (customer_id);
    END IF;
END $$;
