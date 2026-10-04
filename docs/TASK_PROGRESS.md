# BẢNG THEO DÕI TIẾN ĐỘ THỰC HIỆN DỰ ÁN (WBS - 85 TASKS)

> Cập nhật ngày: 2026-10-04  
> Nguồn: `WebChicKen_WBS_85_Tasks.xlsx` & Git Repository `feature/catalog-storefront-cart-checkout`

---

## 📊 Tổng quan tiến độ

| Chỉ số | Giá trị |
|---|---|
| **Tổng số công việc (Total Tasks)** | **85** |
| **Đã hoàn thành (Done)** | **49** (57.6%) |
| **Chưa thực hiện (Pending)** | **36** (42.4%) |

### Tiến độ theo từng giai đoạn (Phase Breakdown)

| Giai đoạn | Mô tả | Tổng | Đã xong | Còn lại | Tỷ lệ |
|---|---|:---:|:---:|:---:|:---:|
| **Giai đoạn 1** | Nền tảng Hạ tầng & Core Engine | 15 | 15 | 0 | **100%** |
| **Giai đoạn 2** | Nghiệp vụ Lõi - Phase 1: Identity, Store & Catalog | 20 | 20 | 0 | **100%** |
| **Giai đoạn 3** | Nghiệp vụ Giao dịch - Phase 2: Inventory, Cart, Promo, Order & Payment | 20 | 14 | 6 | **70%** |
| **Giai đoạn 4** | Hậu mãi, Seller Portal & Backoffice | 15 | 0 | 15 | **0%** |
| **Giai đoạn 5** | Kiểm thử, Bảo mật & Tối ưu Hiệu năng | 10 | 0 | 10 | **0%** |
| **Giai đoạn 6** | Containerization, CI/CD & Go-Live | 5 | 0 | 5 | **0%** |

---

## 📋 Chi tiết các công việc đã hoàn thành (TASK-01 → TASK-49)

### Giai đoạn 1: Nền tảng Hạ tầng & Core Engine (TASK-01 → TASK-15) — ĐÃ XONG 100%
- [x] **TASK-01**: Khởi tạo cấu trúc Monorepo & Quy chuẩn Clean Architecture (`backend-servlet/`, `frontend-client/`, `docs/`, `infra/`).
- [x] **TASK-02**: Thiết lập Apache Tomcat 10.1 & Maven Wrapper cho Backend Servlet 6.0 (`jakarta.*`).
- [x] **TASK-03**: Thiết lập Vite + React 19 + TypeScript + Tailwind CSS cho Frontend Client.
- [x] **TASK-04**: Thiết lập Flyway Migration & Database Schema Baseline (`V001__baseline_schema.sql`).
- [x] **TASK-05**: Xây dựng HikariCP Connection Pool & BaseDAO Thread-safe.
- [x] **TASK-06**: Xây dựng TransactionManager quản lý Transaction biên giới Service.
- [x] **TASK-07**: Xây dựng Servlet Filter Chain: RequestIdFilter, SecurityHeadersFilter, EncodingFilter.
- [x] **TASK-08**: Xây dựng CorsFilter chuẩn chỉnh hỗ trợ Multi-Origin & Credentials.
- [x] **TASK-09**: Xây dựng GlobalExceptionFilter & Cơ chế Chuẩn hóa ApiError Response.
- [x] **TASK-10**: Xây dựng JwtTokenService & Cơ chế Stateless JWT Authentication.
- [x] **TASK-11**: Xây dựng RateLimitingFilter chống Brute-force & DDoS cơ bản.
- [x] **TASK-12**: Xây dựng BaseApiServlet & RequestBodyReader / ResponseWriter tiện ích.
- [x] **TASK-13**: Xây dựng HttpClient phía Frontend (Axios Interceptors, Auto Refresh Token, Error Handling).
- [x] **TASK-14**: Xây dựng Hệ thống Design Tokens CSS (`styles/tokens.css`) & Typography.
- [x] **TASK-15**: Xây dựng Bộ Thư viện Component Atoms & Feedback phía Frontend.

### Giai đoạn 2: Nghiệp vụ Lõi - Phase 1: Identity, Store & Catalog (TASK-16 → TASK-35) — ĐÃ XONG 100%
- [x] **TASK-16**: Viết các DTO cho Module Identity (LoginRequest, RegisterRequest, AuthResponse...).
- [x] **TASK-17**: Hoàn thiện AuthServiceImpl (Đăng ký, Đăng nhập, Băm mật khẩu Argon2/BCrypt).
- [x] **TASK-18**: Hoàn thiện logic Refresh Token xoay vòng (Token Rotation) & Thu hồi phiên (`UserSessionEntity`).
- [x] **TASK-19**: Hoàn thiện CustomerServiceImpl và Sổ địa chỉ giao hàng (`CustomerEntity`, `AddressDAO`).
- [x] **TASK-20**: Hoàn thiện AuthServlet và CustomerServlet RESTful endpoints.
- [x] **TASK-21**: Xây dựng màn hình Đăng ký / Đăng nhập phía Frontend (`LoginForm`, `RegisterForm`, Zod validation).
- [x] **TASK-22**: Xây dựng màn hình Quản lý Hồ sơ & Sổ địa chỉ (`ProfilePage.tsx`, `AddressesPage.tsx`, `AccountLayout.tsx`).
- [x] **TASK-23**: Hoàn thiện SellerApplicationServiceImpl (`SellerApplicationDAO`, quy trình nộp đơn đăng ký nhà bán).
- [x] **TASK-24**: Hoàn thiện StoreServiceImpl và StoreDAO (Quản lý thông tin gian hàng, kho hàng, slug duy nhất).
- [x] **TASK-25**: Hoàn thiện MediaUploadServlet và Storage Service (Upload ảnh an toàn, kiểm tra MIME, UUID).
- [x] **TASK-26**: Xây dựng Component ImageUploader phía Frontend (`ImageUploader.tsx`, preview, progress bar).
- [x] **TASK-27**: Xây dựng DTO và Service cho Cây Danh mục Sản phẩm (`CategoryServiceImpl`, `CategoryDAO`).
- [x] **TASK-28**: Hoàn thiện Quản lý Sản phẩm (SPU) và Biến thể (SKU) Backend (`ProductServiceImpl`, `ProductVariantDAO`).
- [x] **TASK-29**: Hoàn thiện API Tìm kiếm và Lọc sản phẩm nâng cao (`ProductDAO` criteria, phân trang bắt buộc).
- [x] **TASK-30**: Hoàn thiện ProductServlet và CategoryServlet RESTful APIs.
- [x] **TASK-31**: Xây dựng Layout Storefront & Navigation Header Frontend (`StorefrontLayout.tsx`).
- [x] **TASK-32**: Xây dựng Trang chủ Storefront (`HomePage.tsx`, Hero banner, Flash deals, Daily discover).
- [x] **TASK-33**: Xây dựng Component ProductCard (`ProductCard.tsx`, lazy-load, rating, discount badge).
- [x] **TASK-34**: Xây dựng Trang Danh sách sản phẩm & Bộ lọc (PLP - `ProductListingPage.tsx`).
- [x] **TASK-35**: Xây dựng Trang Chi tiết sản phẩm (PDP - `ProductDetailPage.tsx`, chọn biến thể SKU động, gallery).

### Giai đoạn 3: Nghiệp vụ Giao dịch - Phase 2 (TASK-36 → TASK-49) — ĐÃ XONG 14 TASKS
- [x] **TASK-36**: Hoàn thiện InventoryDAO với Khóa chống Bán vượt tồn (`reserveStockAtomic` trừ `stock_quantity`, tăng `reserved_quantity` nguyên tử).
- [x] **TASK-37**: Hoàn thiện InventoryServiceImpl (Cơ chế Stock Reservation có TTL 15 phút, `StockReservationEntity`, commit/release reservation).
- [x] **TASK-38**: Xây dựng CartDAO, CartItemDAO và Entity Giỏ hàng (`CartEntity`, `CartItemEntity` JPA).
- [x] **TASK-39**: Hoàn thiện CartServiceImpl (Tự động kiểm tra biến động giá & tồn kho thực tế, nhóm item theo store).
- [x] **TASK-40**: Hoàn thiện CartServlet (Cung cấp các endpoint RESTful `/api/v1/cart/*`: GET, POST, PUT, DELETE).
- [x] **TASK-41**: Xây dựng Giao diện Giỏ hàng (Cart Page & Drawer) phía Frontend kết nối trực tiếp với backend qua `cartApi.ts` và tự động đồng bộ khi user đăng nhập.
- [x] **TASK-42**: Hoàn thiện VoucherDAO và VoucherServiceImpl (Động cơ kiểm tra điều kiện Voucher: Hạn dùng, đơn tối thiểu, số lượt còn lại, mức giảm % có trần max discount hoặc cố định theo minor units).
- [x] **TASK-43**: Hoàn thiện VoucherServlet (`GET /api/v1/vouchers`, `POST /api/v1/vouchers/validate`) và Component Dialog Chọn Voucher (`VoucherModal.tsx`) trên Frontend.
- [x] **TASK-44**: Thuật toán Multi-Shop Checkout Partition Backend (Tách 1 lần checkout thành N đơn hàng theo từng Shop gom bằng `order_group_id`, sinh mã `order_code` không đoán được theo định dạng `ORD-YYYYMMDD-XXXX`).
- [x] **TASK-45**: Quản lý Giao dịch Đặt hàng Toàn vẹn (Atomic Checkout Transaction: Reserve kho có TTL cho từng SKU -> Insert `OrderEntity` & `OrderItemEntity` -> Xóa sản phẩm tương ứng khỏi giỏ hàng).
- [x] **TASK-46**: Hoàn thiện CheckoutServlet (`POST /api/v1/checkout`) và OrderServlet (`GET /api/v1/orders`, `GET /api/v1/orders/{order_code}`).
- [x] **TASK-47**: Xây dựng Màn hình Checkout nhiều bước Frontend (`CheckoutPage.tsx`: chọn địa chỉ, phân nhóm shop, phí ship từng shop, áp voucher modal, tổng thanh toán, nút chống double-click).
- [x] **TASK-48**: Xây dựng Màn hình Quản lý Đơn hàng Người mua (`OrdersPage.tsx`: Tab trạng thái Chờ xử lý, Đã xác nhận, Đang giao, Đã giao, Đã hủy, xem chi tiết từng đơn và timeline).
- [x] **TASK-49**: Hoàn thiện Logic Hủy Đơn hàng (OrderCancellationDAO & `POST /api/v1/orders/{order_code}/cancel`: Hủy đơn an toàn khi ở PENDING/CONFIRMED, tự động gọi `InventoryService.releaseReservation()` nhả lại kho).

---

## 📌 Các công việc tiếp theo trong Kế hoạch (Bắt đầu từ TASK-50)

- [ ] **TASK-50**: Triển khai Phương thức Thanh toán COD (Payment Module).
- [ ] **TASK-51**: Tích hợp Cổng thanh toán trực tuyến (Sandbox / VNPay HMAC-SHA512 Gateway).
- [ ] **TASK-52**: Xử lý Webhook / IPN Thanh toán an toàn (Idempotency).
- [ ] **TASK-53**: Xây dựng Màn hình Kết quả Thanh toán Frontend (`PaymentResultPage.tsx`).
- [ ] **TASK-54**: Xây dựng State Machine chuyển đổi trạng thái Đơn hàng.
- [ ] **TASK-55**: Xây dựng Worker Giải phóng Kho Quá Hạn (Expired Reservation Worker).
