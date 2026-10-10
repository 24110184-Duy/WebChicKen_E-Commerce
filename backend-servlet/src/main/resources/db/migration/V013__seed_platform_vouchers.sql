-- ============================================================
-- V013: Khởi tạo voucher nền tảng mặc định (Platform Vouchers)
-- ============================================================

INSERT INTO vouchers (
    id, code, type, discount_value_minor, min_order_value_minor, max_discount_amount_minor,
    start_date, end_date, is_active, title, description, store_id, usage_limit, used_count
) VALUES
(
    'vouch001-0000-4000-8000-000000000001',
    'FREESHIP',
    'AMOUNT',
    30000,
    0,
    30000,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '1 year',
    TRUE,
    'Miễn Phí Vận Chuyển Đơn 0Đ',
    'Giảm tối đa 30.000đ phí vận chuyển cho mọi đơn hàng',
    NULL,
    10000,
    0
),
(
    'vouch002-0000-4000-8000-000000000002',
    'FREESHIP50',
    'AMOUNT',
    50000,
    200000,
    50000,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '1 year',
    TRUE,
    'Miễn Phí Vận Chuyển Đơn Từ 200k',
    'Giảm tối đa 50.000đ phí ship cho đơn từ 200.000đ',
    NULL,
    10000,
    0
),
(
    'vouch003-0000-4000-8000-000000000003',
    'CHICKYNEW',
    'AMOUNT',
    20000,
    50000,
    20000,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '1 year',
    TRUE,
    'Voucher Người Mới ChickyMart',
    'Giảm ngay 20.000đ cho đơn hàng đầu tiên từ 50.000đ',
    NULL,
    10000,
    0
),
(
    'vouch004-0000-4000-8000-000000000004',
    'CHICKY10',
    'PERCENTAGE',
    10,
    150000,
    50000,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '1 year',
    TRUE,
    'Giảm 10% Toàn Sàn',
    'Giảm 10% tối đa 50.000đ cho đơn từ 150.000đ',
    NULL,
    10000,
    0
),
(
    'vouch005-0000-4000-8000-000000000005',
    'CHICKYMEGA',
    'AMOUNT',
    50000,
    500000,
    50000,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '1 year',
    TRUE,
    'Mega Voucher Siêu Giảm Giá',
    'Giảm 50.000đ cho đơn hàng giá trị từ 500.000đ',
    NULL,
    10000,
    0
)
ON CONFLICT (id) DO NOTHING;
