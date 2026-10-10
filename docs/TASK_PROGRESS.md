# BẢNG THEO DÕI TIẾN ĐỘ THỰC HIỆN DỰ ÁN (WBS - 85 TASKS)

> Cập nhật ngày: 2026-10-11  
> Nguồn: `WebChicKen_WBS_85_Tasks.xlsx` & Git Repository `feature/catalog-storefront-cart-checkout`

---

## 📊 Tổng quan tiến độ

| Chỉ số | Giá trị |
|---|---|
| **Tổng số công việc (Total Tasks)** | **85** |
| **Đã hoàn thành (Done)** | **70** (82.4%) |
| **Chưa thực hiện (Pending)** | **15** (17.6%) |

### Tiến độ theo từng giai đoạn (Phase Breakdown)

| Giai đoạn | Mô tả | Tổng | Đã xong | Còn lại | Tỷ lệ |
|---|---|:---:|:---:|:---:|:---:|
| **Giai đoạn 1** | Nền tảng Hạ tầng & Core Engine | 15 | 15 | 0 | **100%** |
| **Giai đoạn 2** | Nghiệp vụ Lõi - Phase 1: Identity, Store & Catalog | 20 | 20 | 0 | **100%** |
| **Giai đoạn 3** | Nghiệp vụ Giao dịch - Phase 2: Inventory, Cart, Promo, Order & Payment | 20 | 20 | 0 | **100%** |
| **Giai đoạn 4** | Hậu mãi, Seller Portal & Backoffice | 15 | 15 | 0 | **100%** |
| **Giai đoạn 5** | Kiểm thử, Bảo mật & Tối ưu Hiệu năng | 10 | 0 | 10 | **0%** |
| **Giai đoạn 6** | Containerization, CI/CD & Go-Live | 5 | 0 | 5 | **0%** |

---

## 📋 Chi tiết các công việc đã hoàn thành (TASK-01 → TASK-67)

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

### Giai đoạn 3: Nghiệp vụ Giao dịch - Phase 2 (TASK-36 → TASK-55) — ĐÃ XONG 100%
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
- [x] **TASK-50**: Triển khai Phương thức Thanh toán COD (`PaymentEntity`, `PaymentDAO`, `PaymentServiceImpl`, `PaymentServlet`: tự động tạo giao dịch COD khi checkout, tra cứu thanh toán theo đơn, xác nhận thu tiền mặt COD).
- [x] **TASK-51**: Tích hợp Cổng thanh toán trực tuyến (Sandbox / VNPay HMAC-SHA512 Gateway: `PaymentGateway`, `VNPayGateway`, `CreateVNPayPaymentRequest`, `PaymentUrlResponse`, `PaymentServlet`, `paymentApi.ts`, `CheckoutPage.tsx` & `PaymentResultPage.tsx`).
- [x] **TASK-52**: Xử lý Webhook / IPN Thanh toán an toàn (Idempotency: `VNPayIpnResponse`, `processVNPayIpn` trong `PaymentServiceImpl`, xác minh chữ ký, chống lặp, cập nhật trạng thái đơn sang `CONFIRMED` và thanh toán sang `PAID`, 6 unit tests tự động).
- [x] **TASK-53**: Xây dựng Màn hình Kết quả Thanh toán Frontend (`PaymentResultPage.tsx`: Thông báo trạng thái thanh toán thành công / thất bại theo phản hồi VNPay và COD, 4-step progress timeline, hiển thị mã đơn hàng dạng copyable, chi tiết đơn hàng dạng hóa đơn kèm nút in Receipt, cam kết chuỗi lạnh Cold-Chain, và action buttons điều hướng).
- [x] **TASK-54**: Xây dựng State Machine chuyển đổi trạng thái Đơn hàng (`OrderStateMachine` trong `modules/order/policy/`: Ma trận chuyển đổi nghiêm ngặt PENDING→CONFIRMED→SHIPPING→DELIVERED và CANCELLED/RETURNED, bảng audit `order_status_histories` theo migration V005, tự động xử lý tác vụ phụ giữ/nhả kho và cập nhật thanh toán COD/Refund, 10 unit tests tự động).
- [x] **TASK-55**: Xây dựng Worker Giải phóng Kho Quá Hạn (`ExpiredReservationWorker` trong `modules/inventory/worker/`: `ScheduledJobsListener` chạy ngầm định kỳ 60s có shutdown hook an toàn chuẩn `RES-06`, nhả tồn kho nguyên tử `releaseStockAtomic`, tự động hủy đơn PENDING quá hạn qua `OrderStateMachine` và cập nhật payment sang `FAILED`, `JobServlet` kích hoạt thủ công, 5 unit tests tự động).

### Giai đoạn 4: Hậu mãi, Seller Portal & Backoffice (TASK-56 → TASK-70)

- [x] **TASK-56**: Hoàn thiện ReviewDAO và ReviewServiceImpl (`modules/review/dao/ReviewDAO.java`, `ReviewServiceImpl.java`, migration V006, ràng buộc đơn DELIVERED, chống review lặp 1-1, 1-5 sao, làm sạch XSS).
- [x] **TASK-57**: Tự động tính toán lại Điểm Đánh giá Sản phẩm (`ReviewDAO.calculateSummary()`, `ReviewDAO.updateProductRating()`, cập nhật `avg_rating` và `review_count` vào catalog).
- [x] **TASK-58**: Hoàn thiện ReviewServlet và Component Đánh giá phía Frontend (`ReviewServlet.java`, `ReviewModal.tsx`, `ProductReviews.tsx`, `reviewApi.ts`, tích hợp PLP/PDP/Orders).
- [x] **TASK-59**: Xây dựng Layout Seller Center Frontend (`SellerLayout.tsx`, Sidebar điều hướng, Header thương hiệu, Topbar trạng thái cửa hàng, bảo vệ Seller).
- [x] **TASK-60**: Seller Portal - API và Giao diện Thống kê Bán hàng (`SellerAnalyticsServlet.java`, `SellerDashboardStatsResponse.java`, `SellerDashboardPage.tsx`, Bento KPI, biểu đồ doanh thu theo ngày, số dư khả dụng Withdrawable Balance, ký quỹ Pending Settlement, kênh xử lý đơn hàng, cảnh báo tồn kho gia cầm, bảng xếp hạng Top-Selling Poultry).
- [x] **TASK-61**: Seller Portal - Quản lý Sản phẩm Shop (`SellerProductServlet.java`, `SellerProductListPage.tsx`, `ProductFormModal.tsx`, quản lý SPU/SKU, bộ đếm KPI danh mục cố định, bộ lọc live, chống co dãn giao diện).
- [x] **TASK-62**: Seller Portal - Quản lý & Xử lý Đơn hàng Shop (`SellerOrderServlet.java`, `SellerOrdersPage.tsx`, Bento KPI, bộ lọc tab tức thì không reload trang, `FulfillmentModal.tsx` phân bổ vận chuyển chuỗi lạnh, `SellerOrderDetailModal.tsx` in phiếu đóng gói).
- [x] **TASK-63**: Backoffice Admin - Xây dựng Layout Backoffice Admin Frontend (`AdminLayout.tsx`: Topbar thương hiệu WebChicKen PRO, chỉ báo SLA 99.98% Core Engine, Sidebar nền tối Dark Slate chuẩn ARCHITECTURE 3.5.12 phân cụm Governance/Security/Operations, `AdminDashboardPage.tsx` với Bento KPI GMV 48.25M ₫, 42 Stores, 1,280 Products, 3,850 Orders và Alert Banner phê duyệt).
- [x] **TASK-64**: Backoffice Admin - Module Duyệt Đơn Đăng ký Gian hàng (`SellerApplicationServlet.java`, `Sellers.tsx` / `ShopApprovalPage.tsx`, `adminShopApi.ts`, `ShopDetailModal.tsx`, `RejectReasonModal.tsx`: Thẩm định tiêu chuẩn VietGAP/HACCP/thú y, duyệt mở shop tự động kích hoạt vai trò SELLER & khởi tạo `StoreEntity`, từ chối kèm lý do tùy biến, bộ lọc đa trạng thái, tìm kiếm tức thì).
- [x] **TASK-65**: Backoffice Admin - Module Kiểm duyệt Sản phẩm (`ProductModerationTest`, `ProductServlet.java` (`PUT /{id}/review`), `ProductEntity.rejectionReason`, `V007__add_rejection_reason_to_products.sql`, `adminProductApi.ts`, `ProductDetailModal.tsx`, `ProductRejectModal.tsx`, `pages/admin/Products.tsx`: Bento KPI, danh sách kiểm duyệt đa trạng thái PENDING_APPROVAL/ACTIVE/INACTIVE, thẩm định an toàn sinh học VietGAP, duyệt mở bán công khai hoặc từ chối kèm lý do gửi Người bán).
- [x] **TASK-66**: Backoffice Admin - Module Quản lý Người dùng & Khóa Tài khoản (`AdminUserModerationTest`, `V008__add_banned_until_to_account_bans.sql`, `AccountBanEntity`, `AccountBanDAO.findActiveBanByUserId`, `UserDAO.findAll/countAll`, `AdminUserServiceImpl.banUser/unbanUser`, `AdminUserServlet.java`, `adminUserApi.ts`, `BanUserModal.tsx`, `UnbanUserModal.tsx`, `UserDetailModal.tsx`, `pages/admin/Users.tsx`: Phân trang danh bạ thành viên, bộ lọc vai trò/trạng thái, khóa tài khoản ghi nhận thời gian bắt đầu cấm, thời gian kết thúc, lý do cấm, tự động thu hồi ngay lập tức mọi active session qua `UserSessionDAO.deactivateAllByUserId`, mở khóa tài khoản, timeline kiểm toán vi phạm).
- [x] **TASK-67**: Backoffice Admin - Cơ chế Ghi Nhật ký Quản trị (`V009__add_ip_address_to_audit_logs.sql`, `AuditLogEntity`, `AuditLogDAO`, `AuditLogService`, `AuditLogServiceImpl`, `AuditLogServlet`, `AuditLogServiceTest`: 6 unit tests; tự động ghi nhận lưu vết các thao tác nhạy cảm của Admin gồm `BAN_USER`, `UNBAN_USER`, `APPROVE_PRODUCT`, `REJECT_PRODUCT`, `APPROVE_SELLER`, `REJECT_SELLER`; Frontend: `adminAuditApi.ts`, `AuditLogDetailModal.tsx`, `AuditLogsPage.tsx` Bento KPI, bộ lọc hành động/tài nguyên, tìm kiếm, phân trang, tem bất biến WORM (Write Once, Read Many), tích hợp route `/admin/audit-logs`).
- [x] **TASK-68**: Background Worker - Worker Mô phỏng Quá trình Vận chuyển (`ShippingSimulationWorker.java`, `ShippingSimulationWorkerTest`: 6 unit tests; `OrderDAO.findByStatus`, `OrderStatusHistoryDAO.findLatestHistoryByOrderIdAndToStatus`, `ScheduledJobsListener.java` chu kỳ 30s với 2 threads worker; `JobServlet.java` hỗ trợ endpoint kích hoạt tức thì `POST /api/v1/jobs/simulate-shipping`, tự động chuyển đơn hàng `SHIPPING` sang `DELIVERED`, tự động đồng bộ COD sang `PAID` và ghi nhận nhật ký audit trail `order_status_histories`).
- [x] **TASK-69**: Shop & Feedback - Phản hồi & Khiếu nại từ Nhà Bán (`V010__enhance_feedback_to_admins.sql`, `FeedbackEntity.java`, `FeedbackDAO.java`, `FeedbackService.java`, `FeedbackServiceImpl.java`, `FeedbackServlet.java`, `FeedbackServiceTest.java`: 6 unit tests 100% pass; endpoints `/api/v1/seller/feedbacks`, `/api/v1/admin/feedbacks/*`, tự động ghi sổ nhật ký kiểm toán `RESPOND_FEEDBACK` qua `AuditLogService`; Frontend: `feedbackTypes.ts`, `feedbackApi.ts`, `RespondFeedbackModal.tsx`, `SellerFeedbackPage.tsx` tab gửi phiếu & tra cứu lịch sử, `AdminFeedbacksPage.tsx` Bento KPI, bộ lọc trạng thái/loại khiếu nại, tìm kiếm, tích hợp routes `/seller/feedback` và `/admin/feedbacks`, menu sidebar Seller & Admin).
- [x] **TASK-70**: Background Worker - Quét & Vô hiệu hóa Voucher Hết hạn (`VoucherExpiryWorker.java`, `VoucherExpiryWorkerTest.java`: 6 unit tests 100% pass; `VoucherDAO.findExpiredActiveVouchers/deactivateVoucher/deactivateExpiredVouchers`, `ScheduledJobsListener.java` chu kỳ 60s với 3 threads worker, `JobServlet.java` endpoint kích hoạt tức thì `POST /api/v1/jobs/deactivate-expired-vouchers`, tự động ghi sổ nhật ký audit trail `DEACTIVATE_EXPIRED_VOUCHERS` qua `AuditLogService`; Frontend: `voucherTypes.ts`, `adminVoucherApi.ts`, `AdminVouchersPage.tsx` Bento KPI, bộ lọc trạng thái/loại voucher, tìm kiếm, nút kích hoạt quét tức thì kèm báo cáo kết quả, tích hợp route `/admin/vouchers`).

### 🔧 Nhật ký bảo trì & Sửa lỗi thực tế (Hotfixes & Maintenance - 11/10/2026)
> *Chi tiết đầy đủ mã nguồn và nguyên nhân xem tại:* [`docs/CHANGELOG.md`](./CHANGELOG.md)

- [x] **HOTFIX-01 (Seller Orders Lifecycle Filtering & Dynamic SLA)**: Nâng cấp [`SellerOrdersPage.tsx`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/frontend-client/src/pages/seller/SellerOrdersPage.tsx) và [`SellerOrderServlet.java`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/backend-servlet/src/main/java/com/example/webchicken/modules/order/controller/SellerOrderServlet.java). Khắc phục triệt để lỗi tab *Completed* hiển thị lẫn đơn hủy *CANCELLED*; chuẩn hóa alias trạng thái; bộ lọc ngày tháng `orderDate` thực tế; dropdown lọc đơn vị vận chuyển *All Channels*; đếm badge chính xác; Countdown động theo hạn SLA 2 ngày; CSV export UTF-8 BOM tiếng Việt.
- [x] **HOTFIX-02 (Fix NaN đ trong Order Detail Modal)**: Khắc phục lỗi hiển thị `NaN đ` tại Unit Price & Total trong [`SellerOrderDetailModal.tsx`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/frontend-client/src/features/seller/components/SellerOrderDetailModal.tsx). Bổ sung `@JsonProperty("unitPriceAtPurchaseMinor")` trong [`OrderItemResponse.java`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/backend-servlet/src/main/java/com/example/webchicken/modules/order/model/dto/response/OrderItemResponse.java), mở rộng `SellerOrderItem` trong [`sellerApi.ts`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/frontend-client/src/features/seller/api/sellerApi.ts), fallback an toàn `unitPriceMinor ?? unitPriceAtPurchaseMinor ?? 0`.
- [x] **HOTFIX-03 (Fix My Products Tab 'Sold out' 0 Products)**: Khắc phục lỗi logic De Morgan trong [`SellerProductListPage.tsx`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/frontend-client/src/pages/seller/SellerProductListPage.tsx) khiến tab *Sold out (3)* không hiển thị 3 sản phẩm hết hàng trong kho dù có badge đếm. Đổi điều kiện lọc sang `(p.totalStock ?? 0) <= 0 || p.status === 'OUT_OF_STOCK'`, cập nhật phụ đề ngữ cảnh động và nhãn cảnh báo `Kho: 0 (Hết hàng)`.
- [x] **HOTFIX-04 (Tomcat Dev Script & JDK 21 Build)**: Cập nhật [`infra/scripts/dev-tomcat.ps1`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/infra/scripts/dev-tomcat.ps1) với cờ `-Dmaven.test.skip=true`, tự động nhận diện Tomcat 10.1 và JDK 21; bổ sung import `Optional` trong [`SellerApplicationServiceImpl.java`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/backend-servlet/src/main/java/com/example/webchicken/modules/shop/service/impl/SellerApplicationServiceImpl.java).

---

## 📌 Các công việc tiếp theo (Pending Tasks)

- [ ] **TASK-71 → TASK-80**: Giai đoạn 5 (Kiểm thử, Bảo mật OWASP, k6 Load test, Database indexing).
- [ ] **TASK-81 → TASK-85**: Giai đoạn 6 (Docker multi-stage, Nginx, docker-compose, CI/CD, Go-live).



