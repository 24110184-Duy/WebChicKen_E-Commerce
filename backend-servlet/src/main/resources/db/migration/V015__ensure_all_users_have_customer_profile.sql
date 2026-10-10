-- ============================================================
-- V015: Đảm bảo toàn bộ tài khoản người dùng (bao gồm Seller & Admin) đều có hồ sơ Customer
-- Khắc phục lỗi vi phạm khóa ngoại fk_orders_customers, fk_carts_customers khi Seller/Admin thao tác mua hàng
-- ============================================================

INSERT INTO customers (id, tier, loyalty_point)
SELECT u.id, 'STANDARD', 0
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM customers c WHERE c.id = u.id)
ON CONFLICT (id) DO NOTHING;
