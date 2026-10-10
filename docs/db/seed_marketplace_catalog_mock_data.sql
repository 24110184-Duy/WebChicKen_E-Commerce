-- ============================================================
-- V013: Dữ liệu mẫu khởi tạo Sàn Thương Mại Điện Tử (Marketplace Seed Data)
-- Sàn đa ngành: Điện tử & Công nghệ, Thời trang, Nhà cửa đời sống, v.v.
-- Mật khẩu mặc định cho các tài khoản seed là: secret123
-- ============================================================

-- 1. DANH MỤC SẢN PHẨM SÀN (CATEGORIES)
INSERT INTO categories (id, name, description, created_at)
VALUES
    ('10000000-0000-0000-0000-000000000001', 'Thiết Bị Điện Tử & Công Nghệ', 'Smartphone, laptop, máy tính bảng, tai nghe không dây, thiết bị âm thanh và phụ kiện công nghệ cao', CURRENT_TIMESTAMP),
    ('10000000-0000-0000-0000-000000000002', 'Thời Trang & Phụ Kiện', 'Trang phục nam nữ, giày dép sneaker, túi xách cao cấp, đồng hồ và phụ kiện phong cách thời thượng', CURRENT_TIMESTAMP),
    ('10000000-0000-0000-0000-000000000003', 'Nhà Cửa & Đời Sống', 'Đồ gia dụng thông minh, thiết bị nhà bếp, nội thất decor, dụng cụ chăm sóc không gian sống gia đình', CURRENT_TIMESTAMP),
    ('10000000-0000-0000-0000-000000000004', 'Sức Khỏe & Sắc Đẹp', 'Mỹ phẩm skincare chính hãng, chăm sóc cá nhân, thực phẩm chức năng và sản phẩm bảo vệ sức khỏe', CURRENT_TIMESTAMP),
    ('10000000-0000-0000-0000-000000000005', 'Mẹ & Bé', 'Sữa bỉm, xe đẩy, bình sữa, dinh dưỡng mẹ bầu và đồ chơi giáo dục trí tuệ cho trẻ nhỏ', CURRENT_TIMESTAMP),
    ('10000000-0000-0000-0000-000000000006', 'Thể Thao & Dã Ngoại', 'Trang phục tập gym yoga, giày thể thao chạy bộ, dụng cụ rèn luyện thể lực và lều trại dã ngoại', CURRENT_TIMESTAMP),
    ('10000000-0000-0000-0000-000000000007', 'Bách Hóa & Đồ Ăn Vặt', 'Thực phẩm tiện lợi, đồ uống giải khát, bánh kẹo nhập khẩu và gia vị bếp núc chuẩn vị gia đình', CURRENT_TIMESTAMP),
    ('10000000-0000-0000-0000-000000000008', 'Sách & Văn Phòng Phẩm', 'Sách phát triển bản thân kỹ năng, văn học kinh điển, giáo trình học tập và văn phòng phẩm cao cấp', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- 2. TÀI KHOẢN NGƯỜI DÙNG MẪU (USERS)
-- Password BCrypt: secret123 ($2a$12$2eOj0UbWzj9XYT1XpWOKP.LeDHs8vsfz865v9aseY6O3b/v3sSlGW)
INSERT INTO users (id, username, email, password_hash, full_name, phone, logo_url, logged_in, status, created_at, updated_at)
VALUES
    -- Admin Tổng Quản
    ('a0000000-0000-0000-0000-000000000001', 'admin_super', 'admin@webchicken.vn', '$2a$12$2eOj0UbWzj9XYT1XpWOKP.LeDHs8vsfz865v9aseY6O3b/v3sSlGW', 'Super Admin WebChicKen', '0908889999', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80', FALSE, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    -- Seller 1: TechZone
    ('b0000000-0000-0000-0000-000000000001', 'techzone_official', 'techzone@webchicken.vn', '$2a$12$2eOj0UbWzj9XYT1XpWOKP.LeDHs8vsfz865v9aseY6O3b/v3sSlGW', 'TechZone Official Mall', '0901112233', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&q=80', FALSE, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    -- Seller 2: Coolmate
    ('b0000000-0000-0000-0000-000000000002', 'coolmate_store', 'coolmate@webchicken.vn', '$2a$12$2eOj0UbWzj9XYT1XpWOKP.LeDHs8vsfz865v9aseY6O3b/v3sSlGW', 'Coolmate Flagship Store', '0902223344', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=200&q=80', FALSE, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    -- Seller 3: Lock&Lock
    ('b0000000-0000-0000-0000-000000000003', 'locknlock_vietnam', 'locknlock@webchicken.vn', '$2a$12$2eOj0UbWzj9XYT1XpWOKP.LeDHs8vsfz865v9aseY6O3b/v3sSlGW', 'Lock&Lock Smart Living', '0903334455', 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=200&q=80', FALSE, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    -- Khách hàng mẫu (Customer)
    ('c0000000-0000-0000-0000-000000000001', 'customer_demo', 'customer@webchicken.vn', '$2a$12$2eOj0UbWzj9XYT1XpWOKP.LeDHs8vsfz865v9aseY6O3b/v3sSlGW', 'Nguyễn Văn A', '0901234567', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80', FALSE, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Phân quyền Admin
INSERT INTO admins (id, role)
VALUES ('a0000000-0000-0000-0000-000000000001', 'SUPER_ADMIN')
ON CONFLICT (id) DO NOTHING;

-- Hồ sơ Seller
INSERT INTO sellers (id, tax_code, approved_at)
VALUES
    ('b0000000-0000-0000-0000-000000000001', '0108998822', '2026-09-01 08:00:00'),
    ('b0000000-0000-0000-0000-000000000002', '0315894120', '2026-09-02 08:00:00'),
    ('b0000000-0000-0000-0000-000000000003', '0309112233', '2026-09-03 08:00:00')
ON CONFLICT (id) DO NOTHING;

-- Hồ sơ Customer
INSERT INTO customers (id, tier, loyalty_point)
VALUES ('c0000000-0000-0000-0000-000000000001', 'PLATINUM', 1250)
ON CONFLICT (id) DO NOTHING;

-- Địa chỉ giao hàng mặc định cho Customer
INSERT INTO addresses (id, user_id, recipient_name, phone, address_line1, district, city, is_default, created_at)
VALUES ('ad000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Nguyễn Văn A', '0901234567', '123 Nguyễn Huệ, Phường Bến Nghé', 'Quận 1', 'Hồ Chí Minh', TRUE, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- 3. GIAN HÀNG THƯƠNG MẠI (STORES)
INSERT INTO stores (id, store_name, store_type, seller_id, created_at)
VALUES
    ('s0000000-0000-0000-0000-000000000001', 'TechZone Official Store', 'MALL', 'b0000000-0000-0000-0000-000000000001', '2026-09-01 08:00:00'),
    ('s0000000-0000-0000-0000-000000000002', 'Coolmate Flagship Store', 'MALL', 'b0000000-0000-0000-0000-000000000002', '2026-09-02 08:00:00'),
    ('s0000000-0000-0000-0000-000000000003', 'Lock&Lock Smart Living', 'MALL', 'b0000000-0000-0000-0000-000000000003', '2026-09-03 08:00:00')
ON CONFLICT (id) DO NOTHING;

-- 4. SẢN PHẨM TIÊU BIỂU (PRODUCTS)
INSERT INTO products (id, store_id, category_id, name, description, status, rejection_reason, created_at, updated_at)
VALUES
    -- 1. Tai nghe chống ồn Sony
    ('d0000000-0000-0000-0000-000000000001',
     's0000000-0000-0000-0000-000000000001',
     '10000000-0000-0000-0000-000000000001',
     'Tai Nghe Không Dây Sony WH-1000XM5 Chống Ồn Chủ Động ANC',
     'Tai nghe over-ear đầu bảng từ Sony trang bị công nghệ chống ồn chủ động Auto NC Optimizer hàng đầu thế giới, thời lượng pin lên đến 30 giờ, đàm thoại sắc nét 4 micro beamforming, hỗ trợ High-Resolution Audio Không Dây LDAC cao cấp.',
     'ACTIVE', NULL, '2026-09-10 10:00:00', '2026-09-10 10:00:00'),

    -- 2. Apple iPhone 15 Pro Max
    ('d0000000-0000-0000-0000-000000000002',
     's0000000-0000-0000-0000-000000000001',
     '10000000-0000-0000-0000-000000000001',
     'Apple iPhone 15 Pro Max 256GB - Khung Titan Chuẩn Hàng Chính Hãng VN/A',
     'Thiết kế khung Titan chuẩn hàng không vũ trụ siêu nhẹ và bền bỉ. Chip A17 Pro đỉnh cao mang lại hiệu năng đồ họa thế hệ mới, camera tiềm vọng telephoto 5x sắc nét, cổng USB-C tốc độ truyền dữ liệu vượt trội và nút Action Button tùy biến.',
     'ACTIVE', NULL, '2026-09-11 10:00:00', '2026-09-11 10:00:00'),

    -- 3. Apple Watch Series 9
    ('d0000000-0000-0000-0000-000000000001',
     's0000000-0000-0000-0000-000000000001',
     '10000000-0000-0000-0000-000000000001',
     'Đồng Hồ Thông Minh Apple Watch Series 9 GPS 45mm Viền Nhôm',
     'Trang bị chip S9 SiP mạnh mẽ với cử chỉ chạm 2 lần Double Tap kỳ diệu, màn hình sáng gấp đôi lên tới 2000 nits, theo dõi chỉ số sức khỏe nhịp tim, nồng độ oxy trong máu SpO2, giấc ngủ và các bài tập luyện thể thao chuyên sâu.',
     'ACTIVE', NULL, '2026-09-12 10:00:00', '2026-09-12 10:00:00'),

    -- 4. Áo thun Coolmate Cotton Compact
    ('d0000000-0000-0000-0000-000000000004',
     's0000000-0000-0000-0000-000000000002',
     '10000000-0000-0000-0000-000000000002',
     'Áo Thun Nam Cổ Tròn Cotton Compact Chống Nhăn Thoáng Khí Coolmate',
     'Chất liệu 100% Cotton Compact cao cấp chải kỹ 2 mặt mềm mại, thấm hút mồ hôi tối đa, form suông năng động tôn dáng phái mạnh, độ bền màu cao và không xù lông sau nhiều lần giặt máy.',
     'ACTIVE', NULL, '2026-09-13 10:00:00', '2026-09-13 10:00:00'),

    -- 5. Giày chạy bộ Nike Air Zoom Pegasus
    ('d0000000-0000-0000-0000-000000000005',
     's0000000-0000-0000-0000-000000000002',
     '10000000-0000-0000-0000-000000000006',
     'Giày Thể Thao Chạy Bộ Nam Nữ Nike Air Zoom Pegasus Siêu Êm Siêu Nhẹ',
     'Đệm bọt React đàn hồi kết hợp túi khí Zoom Air kép ở bàn chân trước và gót chân, thân giày vải lưới mesh kỹ thuật thoáng khí tối đa, đế ngoài cao su rãnh bánh quế bám đường vượt trội trên mọi cung đường chạy.',
     'ACTIVE', NULL, '2026-09-14 10:00:00', '2026-09-14 10:00:00'),

    -- 6. Bình giữ nhiệt Lock&Lock
    ('d0000000-0000-0000-0000-000000000006',
     's0000000-0000-0000-0000-000000000003',
     '10000000-0000-0000-0000-000000000003',
     'Bình Giữ Nhiệt Thép Không Gỉ 316L Lock&Lock One-Touch 550ml',
     'Ruột bình thép không gỉ SUS316L y tế chống ăn mòn và an toàn tuyệt đối cho sức khỏe, giữ nhiệt nóng và lạnh liên tục suốt 24 giờ, nắp mở bật 1 chạm có khóa cài chống rò rỉ nước tiện lợi mang theo đi học và đi làm.',
     'ACTIVE', NULL, '2026-09-15 10:00:00', '2026-09-15 10:00:00'),

    -- 7. Nồi chiên không dầu Philips Airfryer
    ('d0000000-0000-0000-0000-000000000007',
     's0000000-0000-0000-0000-000000000003',
     '10000000-0000-0000-0000-000000000003',
     'Nồi Chiên Không Dầu Điện Tử Dung Tích 6.2L Philips Rapid Air XL',
     'Công nghệ Rapid Air xoáy nhiệt tuần hoàn 360 độ giúp thực phẩm chín đều giòn rụm bên ngoài và mềm mọng bên trong, giảm tới 90% lượng chất béo có hại, bảng điều khiển cảm ứng LED với 7 chế độ cài đặt sẵn tiện dụng.',
     'ACTIVE', NULL, '2026-09-16 10:00:00', '2026-09-16 10:00:00'),

    -- 8. Sách Atomic Habits
    ('d0000000-0000-0000-0000-000000000008',
     's0000000-0000-0000-0000-000000000002',
     '10000000-0000-0000-0000-000000000008',
     'Sách Atomic Habits - Thay Đổi Tí Hon Hiệu Quả Bất Ngờ (James Clear)',
     'Tác phẩm kinh điển bán chạy toàn cầu của James Clear hướng dẫn cách hình thành thói quen tốt và phá bỏ thói quen xấu một cách có hệ thống, từng bước cải thiện 1% mỗi ngày để tạo nên sự bứt phá phi thường trong cuộc sống.',
     'ACTIVE', NULL, '2026-09-17 10:00:00', '2026-09-17 10:00:00')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    status = EXCLUDED.status;

-- 5. BIẾN THỂ SẢN PHẨM & GIÁ BÁN (PRODUCT_VARIANTS)
-- Tiền tệ: Minor unit (VND không có cent, 1 VND = 1 minor unit)
INSERT INTO product_variants (id, product_id, attribute, base_price_minor, stock_quantity, reserved_quantity)
VALUES
    -- Sony WH-1000XM5
    ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Màu Đen Nhám (Black)', 7490000, 85, 0),
    ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'Màu Bạc Platinum (Silver)', 7490000, 45, 0),

    -- iPhone 15 Pro Max
    ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', 'Titan Tự Nhiên - 256GB', 29990000, 35, 0),
    ('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002', 'Titan Xanh Blue - 256GB', 29990000, 20, 0),
    ('e0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000002', 'Titan Đen Black - 512GB', 34990000, 15, 0),

    -- Apple Watch Series 9
    ('e0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000001', 'Midnight Aluminum Case 45mm', 10290000, 50, 0),
    ('e0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000001', 'Starlight Aluminum Case 45mm', 10290000, 40, 0),

    -- Áo thun Coolmate
    ('e0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000004', 'Màu Đen - Size M', 199000, 200, 0),
    ('e0000000-0000-0000-0000-000000000009', 'd0000000-0000-0000-0000-000000000004', 'Màu Đen - Size L', 199000, 250, 0),
    ('e0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000004', 'Màu Trắng - Size M', 199000, 180, 0),
    ('e0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000004', 'Màu Xanh Navy - Size XL', 199000, 120, 0),

    -- Nike Pegasus
    ('e0000000-0000-0000-0000-000000000012', 'd0000000-0000-0000-0000-000000000005', 'Phantom Black - Size 40', 2450000, 45, 0),
    ('e0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000005', 'Phantom Black - Size 41', 2450000, 60, 0),
    ('e0000000-0000-0000-0000-000000000014', 'd0000000-0000-0000-0000-000000000005', 'Phantom Black - Size 42', 2450000, 55, 0),

    -- Bình Lock&Lock
    ('e0000000-0000-0000-0000-000000000015', 'd0000000-0000-0000-0000-000000000006', 'Màu Xanh Mint Pastel - 550ml', 349000, 150, 0),
    ('e0000000-0000-0000-0000-000000000016', 'd0000000-0000-0000-0000-000000000006', 'Màu Xám Đen Sang Trọng - 550ml', 349000, 120, 0),

    -- Nồi chiên Philips
    ('e0000000-0000-0000-0000-000000000017', 'd0000000-0000-0000-0000-000000000007', 'Dung Tích 6.2L - Màu Đen', 2890000, 70, 0),

    -- Sách Atomic Habits
    ('e0000000-0000-0000-0000-000000000018', 'd0000000-0000-0000-0000-000000000008', 'Bản Tiếng Việt (Bìa Mềm)', 169000, 300, 0)
ON CONFLICT (id) DO UPDATE
SET base_price_minor = EXCLUDED.base_price_minor,
    stock_quantity = EXCLUDED.stock_quantity;

-- 6. HÌNH ẢNH SẢN PHẨM (PRODUCT_IMAGES)
INSERT INTO product_images (id, product_id, image_url)
VALUES
    ('im000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80'),
    ('im000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&auto=format&fit=crop&q=80'),

    ('im000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80'),

    ('im000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'),

    ('im000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'),

    ('im000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80'),

    ('im000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80'),

    ('im000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000007', 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&auto=format&fit=crop&q=80'),

    ('im000000-0000-0000-0000-000000000009', 'd0000000-0000-0000-0000-000000000008', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop&q=80')
ON CONFLICT (id) DO NOTHING;

-- 7. MÃ GIẢM GIÁ KHUYẾN MẠI (VOUCHERS)
INSERT INTO vouchers (
    id, code, type, discount_value_minor, min_order_value_minor, max_discount_amount_minor,
    start_date, end_date, is_active, title, description, store_id, usage_limit, used_count
)
VALUES
    ('f0000000-0000-0000-0000-000000000001', 'FREESHIP50', 'FIXED', 50000, 150000, 50000,
     '2026-09-01 00:00:00', '2026-12-31 23:59:59', TRUE,
     'Miễn Phí Vận Chuyển 50K Toàn Sàn', 'Áp dụng cho mọi đơn hàng từ 150K khi thanh toán trực tuyến hoặc COD', NULL, 10000, 128),

    ('f0000000-0000-0000-0000-000000000002', 'TECH500K', 'FIXED', 500000, 5000000, 500000,
     '2026-09-01 00:00:00', '2026-12-31 23:59:59', TRUE,
     'Siêu Sale Công Nghệ Giảm 500K', 'Áp dụng cho các sản phẩm điện thoại, laptop và thiết bị âm thanh từ 5 triệu', 's0000000-0000-0000-0000-000000000001', 1000, 45),

    ('f0000000-0000-0000-0000-000000000003', 'MALLSUPER10', 'PERCENT', 10, 300000, 150000,
     '2026-09-01 00:00:00', '2026-12-31 23:59:59', TRUE,
     'Giảm 10% Tối Đa 150K Gian Hàng Mall', 'Áp dụng cho toàn bộ sản phẩm thuộc các gian hàng chính hãng Official Mall', NULL, 5000, 310),

    ('f0000000-0000-0000-0000-000000000004', 'CHICKYNEW', 'FIXED', 30000, 99000, 30000,
     '2026-09-01 00:00:00', '2026-12-31 23:59:59', TRUE,
     'Ưu Đãi Khách Hàng Mới 30K', 'Chào mừng thành viên mới WebChicKen - Giảm ngay 30K cho đơn hàng đầu tiên từ 99K', NULL, 50000, 1240)
ON CONFLICT (id) DO UPDATE
SET is_active = EXCLUDED.is_active,
    title = EXCLUDED.title,
    description = EXCLUDED.description;

-- 8. ĐÁNH GIÁ MẪU CỦA KHÁCH HÀNG (PRODUCT_REVIEWS)
INSERT INTO product_reviews (
    id, user_id, product_id, rating, comment, media_urls,
    seller_reply, seller_reply_at, status, helpful_count, order_id, order_item_id, post_at, created_at, updated_at
)
VALUES
    ('r0000000-0000-0000-0000-000000000001',
     'c0000000-0000-0000-0000-000000000001',
     'd0000000-0000-0000-0000-000000000001',
     5,
     'Tai nghe Sony WH-1000XM5 quá xuất sắc! Khả năng chống ồn ANC cực kỳ ấn tượng, đeo êm tai không bị cấn dù dùng liên tục 4-5 tiếng. Âm bass sâu và ấm, pin trâu dùng cả tuần chưa hết. Hộp đóng gói nguyên seal chính hãng, giao hàng 2H nhanh như chớp!',
     '["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80"]'::json,
     'TechZone Official Store chân thành cảm ơn quý khách đã tin dùng sản phẩm Sony chính hãng! Chúc bạn có những phút giây thưởng thức âm nhạc tuyệt vời.',
     '2026-09-20 14:30:00',
     'APPROVED', 18, NULL, NULL, '2026-09-20 11:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    ('r0000000-0000-0000-0000-000000000002',
     'c0000000-0000-0000-0000-000000000001',
     'd0000000-0000-0000-0000-000000000004',
     5,
     'Áo thun Coolmate chất lượng tuyệt vời, vải Cotton Compact sờ vào mát rượi và co giãn tốt. Giặt máy không bị xù hay bai dão cổ áo. Giá sale quá hời cho một chiếc áo mặc thường ngày.',
     '["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80"]'::json,
     'Coolmate Flagship cảm ơn bạn rất nhiều! Rất vui vì bạn hài lòng với chất lượng áo Cotton Compact.',
     '2026-09-22 10:00:00',
     'APPROVED', 12, NULL, NULL, '2026-09-22 09:15:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;
