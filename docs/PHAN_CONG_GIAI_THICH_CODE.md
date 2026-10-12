# KẾ HOẠCH & TÀI LIỆU PHÂN CÔNG GIẢI THÍCH CODE — HỆ THỐNG WEBCHICKEN E-COMMERCE

> **Dành cho:** Nhóm 3 thành viên báo cáo đồ án Lập trình Web.  
> **Mục tiêu:** Phân định rõ ràng 100% phạm vi mã nguồn, kiến trúc, cơ sở dữ liệu và kịch bản thuyết trình từ Frontend đến Backend (End-to-End). Đảm bảo tính liền mạch, cân bằng khối lượng (33% - 33% - 33%), không chồng chéo và hỗ trợ vấn đáp phản biện xuất sắc.

---

## 🧭 TỔNG QUAN CHIẾN LƯỢC PHÂN BỔ 3 VAI DIỄN

Hệ thống được chia theo 3 trục nghiệp vụ kinh điển của sàn thương mại điện tử:

```
[THÀNH VIÊN 1: THE GATEKEEPER]       ➔   [THÀNH VIÊN 2: THE GOVERNOR]         ➔   [THÀNH VIÊN 3: THE ENGINE]
Hạ tầng, An ninh, Xác thực & RBAC        Kênh Nhà bán, Kiểm duyệt VietGAP & WORM      Storefront, Khóa kho & Thanh toán
(Dựng sàn & Bảo vệ cổng vào)              (Đưa hàng lên kệ & Quản trị đối tác)          (Trải nghiệm khách & Khớp lệnh giao dịch)
```

| Tiêu chí | 👤 Thành viên 1 | 👤 Thành viên 2 | 👤 Thành viên 3 |
|---|---|---|---|
| **Vai trò chính** | Hạ tầng, Scripts, Bảo mật & Phân quyền RBAC | Kênh Nhà bán & Kiểm duyệt sàn (Seller & Governance) | Storefront, Giao dịch, Khóa kho & Thanh toán |
| **Số bảng Database** | **6 bảng** (`users`, `user_roles`, `user_sessions`, `account_bans`, `customers`, `addresses`) | **8 bảng** (`seller_applications`, `stores`, `products`, `product_variants`, `product_images`, `media_files`, `audit_logs`, `feedbacks`) | **11 bảng** (`categories`, `carts`, `cart_items`, `vouchers`, `voucher_usages`, `inventories`, `stock_reservations`, `order_groups`, `orders`, `order_items`, `order_status_histories`, `payments`, `reviews`) |
| **Số File Frontend** | **12 files** (Guards, Auth, Profile, Admin Users, State) | **16 files** (Seller Portal, Admin Moderation, Modals, APIs) | **14 files** (Storefront, PDP SKU, Cart, Multi-step Checkout, VNPay Result, APIs) |
| **Số Class / Script BE** | **18 classes / scripts** (Bootstrap, Filter Chain, Security, Auth, User DAO) | **15 classes** (Seller/Store Servlets, Dual-track Moderation, Storage, Audit) | **23 classes / workers** (Order, Dynamic SKU, Atomic Reservation, VNPay, 3 Background Workers) |
| **Điểm nhấn kỹ thuật** | Pure DI, JWT In-memory, Token Hash, Filter Chain, Chế tài Ban tức thì | Bộ lọc kiểm duyệt 2 luồng (AI/Rule Scanner), Chuỗi lạnh, Nhật ký WORM | Khóa tồn kho nguyên tử (Atomic Lock SQL), Tách đơn đa shop, VNPay HMAC-SHA512 |

---

## 👤 CHI TIẾT THÀNH VIÊN 1: HẠ TẦNG, SCRIPTS, BẢO MẬT & PHÂN QUYỀN RBAC

### 1. Bảng Database phụ trách (6 Bảng)
1. `users`: Bảng người dùng gốc (id, username, email, password_hash, status [ACTIVE/BANNED], created_at).
2. `user_roles`: Phân quyền n-n (user_id, role [CUSTOMER, SELLER, ADMIN]).
3. `user_sessions`: Quản lý phiên token (id, user_id, refresh_token_hash, is_revoked, expires_at).
4. `account_bans`: Lưu chế tài vi phạm (ban_id, user_id, description, banned_by, banned_at, banned_until, unbanned_at).
5. `customers`: Hồ sơ chi tiết người mua (user_id, full_name, phone, loyalty_tier).
6. `addresses`: Sổ địa chỉ nhận hàng (id, customer_id, receiver_name, phone_number, full_address, is_default).

### 2. Danh mục File Frontend phụ trách (12 Files)
- **Kịch bản Định tuyến & Chặn quyền (Guards):**
  - `frontend-client/src/router/index.tsx`: Cây định tuyến phân cấp toàn sàn.
  - `frontend-client/src/router/guards/RequireAuth.tsx`: Chặn người dùng chưa đăng nhập.
  - `frontend-client/src/router/guards/RequireRole.tsx`: Chặn quyền theo vai trò (`allowedRoles`).
- **Màn hình giao diện (Pages):**
  - `frontend-client/src/pages/auth/LoginPage.tsx`: Giao diện đăng nhập tài khoản.
  - `frontend-client/src/pages/auth/RegisterPage.tsx`: Giao diện đăng ký tài khoản.
  - `frontend-client/src/pages/customer/ProfilePage.tsx`: Xem và chỉnh sửa hồ sơ cá nhân.
  - `frontend-client/src/pages/customer/AddressesPage.tsx`: Sổ địa chỉ giao hàng của khách.
  - `frontend-client/src/pages/admin/Users.tsx`: Màn hình quản trị danh bạ tài khoản & thực thi cấm.
- **Components & State:**
  - `frontend-client/src/features/auth/authStore.ts` (hoặc `src/app/store/authStore.ts`): Quản lý User, In-memory Token và Roles.
  - `frontend-client/src/lib/httpClient.ts`: Axios Interceptors tự động bắt mã 401 gọi refresh token xoay vòng.
  - `frontend-client/src/components/admin/BanUserModal.tsx`: Modal nhập lý do, thời hạn ban tài khoản.
  - `frontend-client/src/components/admin/UnbanUserModal.tsx`: Modal gỡ lệnh phạt tài khoản.

### 3. Danh mục Class Backend & Scripts phụ trách (18 Classes / Scripts)
- **Kịch bản Khởi chạy & Khởi tạo (Bootstrap & Scripts):**
  - `infra/scripts/dev-tomcat.ps1`: Script PowerShell build Vite, build Maven WAR và deploy Tomcat tự động.
  - `backend-servlet/src/main/java/com/example/webchicken/bootstrap/AppBootstrapListener.java`: Khởi tạo HikariCP và Flyway Migration.
  - `backend-servlet/src/main/java/com/example/webchicken/bootstrap/CompositionRoot.java`: Khởi tạo tiêm phụ thuộc Pure DI thủ công (không Spring).
- **Chuỗi Filter Chain & An ninh:**
  - `backend-servlet/src/main/java/com/example/webchicken/infrastructure/filter/RequestIdFilter.java`: Gắn UUID RequestId theo dõi chuỗi log.
  - `backend-servlet/src/main/java/com/example/webchicken/infrastructure/filter/SecurityHeadersFilter.java`: Tiêu chuẩn bảo mật CSP, HSTS, X-Frame-Options.
  - `backend-servlet/src/main/java/com/example/webchicken/infrastructure/filter/CorsFilter.java`: Cấu hình CORS & Credentials cho môi trường dev.
  - `backend-servlet/src/main/java/com/example/webchicken/infrastructure/filter/RateLimitingFilter.java`: Giới hạn tần suất gọi API chống DDoS/Brute-force.
  - `backend-servlet/src/main/java/com/example/webchicken/infrastructure/filter/GlobalExceptionFilter.java`: Bắt lỗi toàn cục, chuẩn hóa JSON `ApiError`.
  - `backend-servlet/src/main/java/com/example/webchicken/infrastructure/filter/AuthenticationFilter.java`: Bộ lọc giải mã Bearer Token & trích xuất Roles RBAC.
  - `backend-servlet/src/main/java/com/example/webchicken/infrastructure/security/JwtProvider.java`: Ký và giải mã JWT token bằng thuật toán HMAC.
- **Controllers, Services & DAOs:**
  - `backend-servlet/src/main/java/com/example/webchicken/modules/identity/controller/AuthServlet.java`
  - `backend-servlet/src/main/java/com/example/webchicken/modules/identity/controller/CustomerServlet.java`
  - `backend-servlet/src/main/java/com/example/webchicken/modules/identity/controller/AdminUserServlet.java`
  - `backend-servlet/src/main/java/com/example/webchicken/modules/identity/service/AuthServiceImpl.java`
  - `backend-servlet/src/main/java/com/example/webchicken/modules/identity/service/CustomerServiceImpl.java`
  - `backend-servlet/src/main/java/com/example/webchicken/modules/identity/service/AdminUserServiceImpl.java`
  - `backend-servlet/src/main/java/com/example/webchicken/modules/identity/dao/UserDAO.java`
  - `backend-servlet/src/main/java/com/example/webchicken/modules/identity/dao/UserSessionDAO.java`
  - `backend-servlet/src/main/java/com/example/webchicken/modules/identity/dao/AccountBanDAO.java`
  - `backend-servlet/src/main/java/com/example/webchicken/modules/identity/dao/AddressDAO.java`

### 4. Mạch giải thích liền mạch (Storyline của Thành viên 1)
```
[1. Khởi động sàn]  ➔  [2. Tuần tra an ninh]  ➔  [3. Cấp thẻ vào cổng]  ➔  [4. Phân quyền & Chế tài]
 (dev-tomcat.ps1,        (RequestId, CORS,         (Login, BCrypt, JWT,       (RequireRole, RBAC Filter,
  Bootstrap, Pure DI)     RateLimit, SecHeaders)    Refresh In-memory)         BanUser & Hủy Session)
```
- **Bước 1 (Dựng móng):** Bắt đầu bài thuyết trình bằng việc chứng minh hệ thống khởi chạy sạch sẽ: Chạy lệnh `dev-tomcat.ps1` ➔ giải thích `AppBootstrapListener` khởi tạo kết nối HikariCP, gọi Flyway migrate 6 bảng danh tính ➔ giải thích `CompositionRoot` tạo instance và tiêm phụ thuộc qua Constructor (Pure DI).
- **Bước 2 (Gác cổng):** Khi một request bất kỳ từ FE gửi đến ➔ Đi qua chuỗi Filter tuần tự: `RequestIdFilter` gắn UUID ➔ `CorsFilter` kiểm soát nguồn gốc ➔ `RateLimitingFilter` ngăn spam request ➔ `SecurityHeadersFilter` chống clickjacking.
- **Bước 3 (Đăng nhập & Phiên làm việc):** Người dùng thao tác trên `LoginPage.tsx` ➔ gửi dữ liệu qua `httpClient.ts` ➔ `AuthServlet` ➔ `AuthServiceImpl` (so khớp mật khẩu BCrypt) ➔ `JwtProvider` cấp Access Token ngắn hạn (FE lưu trong `authStore` in-memory để chống XSS) và băm Refresh Token lưu vào `user_sessions`. Khi access token hết hạn, Interceptor tại `httpClient.ts` bắt mã 401 tự động gọi refresh xoay vòng mà người dùng không bị gián đoạn.
- **Bước 4 (Bảo vệ tài nguyên & Chế tài vi phạm):** Phân quyền 2 lớp: FE chặn tại `router/index.tsx` qua `RequireAuth` và `RequireRole` (`allowedRoles`); BE chặn tại `AuthenticationFilter` đọc claims. Khi phát hiện tài khoản gian lận, Admin mở `BanUserModal.tsx` tại `pages/admin/Users.tsx` ➔ gọi `AdminUserServlet` ➔ `AdminUserServiceImpl` ghi nhận án phạt vào `account_bans`, đồng thời **thu hồi lập tức toàn bộ refresh token trong `user_sessions`** để kick người dùng ra khỏi hệ thống ngay trong tích tắc.

*(👉 **Lời dẫn chuyển giao cho Thành viên 2:** "Sau khi hệ thống hạ tầng đã được dựng lên an toàn và tài khoản đã được phân quyền chặt chẽ, tiếp theo xin mời bạn Thành viên 2 trình bày về quy trình một người dùng nâng cấp lên Nhà bán hàng (Seller) và cơ chế sàn kiểm duyệt chất lượng hàng hóa VietGAP.")*

---

## 👤 CHI TIẾT THÀNH VIÊN 2: KÊNH NHÀ BÁN & QUẢN TRỊ KIỂM DUYỆT SÀN (SELLER & GOVERNANCE)

### 1. Bảng Database phụ trách (8 Bảng)
1. `seller_applications`: Hồ sơ xin mở shop (id, user_id, shop_name, tax_code, vietgap_cert, status [PENDING/APPROVED/REJECTED]).
2. `stores`: Gian hàng chính thức (id, seller_id, shop_name, slug, logo_url, rating_avg).
3. `products`: Sản phẩm gốc SPU (id, store_id, name, description, status [PENDING_APPROVAL/ACTIVE/INACTIVE/REJECTED], rejection_reason).
4. `product_variants`: Biến thể SKU (id, product_id, sku_code, price_minor, stock_quantity).
5. `product_images`: Bộ sưu tập ảnh sản phẩm (id, product_id, image_url, is_primary).
6. `media_files`: Tệp lưu trữ upload trên server (id, file_name, file_path, mime_type, file_size).
7. `audit_logs`: Nhật ký an ninh bất biến WORM (id, admin_id, action, resource_type, resource_id, ip_address).
8. `feedbacks`: Khiếu nại và phản hồi 2 chiều (id, seller_id, title, content, status, response, responded_by).

### 2. Danh mục File Frontend phụ trách (16 Files)
- **Layouts & Kênh Người bán (Seller Center):**
  - `frontend-client/src/layouts/SellerLayout.tsx`: Khung điều hướng Sidebar & Header của Seller Center.
  - `frontend-client/src/pages/seller/SellerRegisterPage.tsx`: Giao diện nộp hồ sơ mở gian hàng (MST, VietGAP).
  - `frontend-client/src/pages/seller/SellerDashboardPage.tsx`: Bảng số liệu doanh thu, số dư, top bán chạy.
  - `frontend-client/src/pages/seller/SellerProductListPage.tsx`: Quản lý kho sản phẩm của gian hàng.
  - `frontend-client/src/components/seller/ProductFormModal.tsx`: Form đăng bán sản phẩm, cấu hình SKU biến thể động.
  - `frontend-client/src/pages/seller/SellerOrdersPage.tsx`: Tiếp nhận & xác nhận đóng gói đơn hàng.
  - `frontend-client/src/components/seller/SellerOrderDetailModal.tsx`: Chi tiết đơn hàng và in phiếu xuất kho chuỗi lạnh.
  - `frontend-client/src/pages/seller/SellerFeedbackPage.tsx`: Gửi khiếu nại, phản hồi từ Seller lên Admin.
- **Layouts & Kênh Quản trị sàn (Backoffice Admin):**
  - `frontend-client/src/layouts/AdminLayout.tsx`: Khung quản trị viên Backoffice.
  - `frontend-client/src/pages/admin/AdminDashboardPage.tsx`: Thống kê toàn cảnh sàn thương mại.
  - `frontend-client/src/pages/admin/Sellers.tsx`: Màn hình thẩm định hồ sơ đăng ký mở gian hàng.
  - `frontend-client/src/pages/admin/Products.tsx`: Trung tâm kiểm duyệt sản phẩm 2 luồng & gỡ ẩn.
  - `frontend-client/src/components/admin/ProductDetailModal.tsx`: Thẩm định chi tiết chứng nhận VietGAP của sản phẩm.
  - `frontend-client/src/components/admin/ProductUnhideModal.tsx`: Modal gỡ ẩn sản phẩm sau giải trình.
  - `frontend-client/src/pages/admin/AuditLogsPage.tsx`: Bảng tra cứu nhật ký an ninh WORM.
  - `frontend-client/src/pages/admin/AdminFeedbacksPage.tsx`: Tiếp nhận và giải quyết khiếu nại của Seller.
- **API Clients phụ trách:** `sellerApi.ts`, `adminShopApi.ts`, `adminProductApi.ts`, `adminAuditApi.ts`, `feedbackApi.ts`.

### 3. Danh mục Class Backend phụ trách (15 Classes)
- **Controllers / Servlets:**
  - `backend-servlet/src/main/java/com/example/webchicken/modules/shop/controller/SellerApplicationServlet.java`: Đăng ký và duyệt hồ sơ gian hàng.
  - `backend-servlet/src/main/java/com/example/webchicken/modules/shop/controller/StoreServlet.java`: Hồ sơ và cấu hình cửa hàng.
  - `backend-servlet/src/main/java/com/example/webchicken/modules/catalog/controller/SellerProductServlet.java`: CRUD sản phẩm và biến thể phía Shop.
  - `backend-servlet/src/main/java/com/example/webchicken/modules/catalog/controller/ProductServlet.java` (nhánh Admin PUT `/api/v1/products/{id}/review` duyệt/ẩn hàng).
  - `backend-servlet/src/main/java/com/example/webchicken/modules/order/controller/SellerOrderServlet.java`: Phân loại đơn hàng phía Shop.
  - `backend-servlet/src/main/java/com/example/webchicken/modules/order/controller/SellerAnalyticsServlet.java`: Thống kê doanh thu, báo cáo của shop.
  - `backend-servlet/src/main/java/com/example/webchicken/modules/media/controller/MediaUploadServlet.java`: Tiếp nhận upload hình ảnh, chứng chỉ.
  - `backend-servlet/src/main/java/com/example/webchicken/modules/backoffice/controller/AuditLogServlet.java`: Tra cứu audit trail của hệ thống.
  - `backend-servlet/src/main/java/com/example/webchicken/modules/backoffice/controller/FeedbackServlet.java`: Xử lý phản hồi 2 chiều Seller - Admin.
- **Services & DAOs:**
  - `backend-servlet/src/main/java/com/example/webchicken/modules/shop/service/SellerApplicationServiceImpl.java`
  - `backend-servlet/src/main/java/com/example/webchicken/modules/shop/service/StoreServiceImpl.java`
  - `backend-servlet/src/main/java/com/example/webchicken/modules/catalog/service/ProductServiceImpl.java` (chứa logic `isHealthOrSafetyRisk` quét `HEALTH_AND_SAFETY_KEYWORDS`).
  - `backend-servlet/src/main/java/com/example/webchicken/modules/media/service/StorageServiceImpl.java`
  - `backend-servlet/src/main/java/com/example/webchicken/modules/backoffice/service/AuditLogServiceImpl.java`
  - `backend-servlet/src/main/java/com/example/webchicken/modules/backoffice/service/FeedbackServiceImpl.java`
  - `backend-servlet/src/main/java/com/example/webchicken/modules/shop/dao/SellerApplicationDAO.java`
  - `backend-servlet/src/main/java/com/example/webchicken/modules/shop/dao/StoreDAO.java`
  - `backend-servlet/src/main/java/com/example/webchicken/modules/backoffice/dao/AuditLogDAO.java`
  - `backend-servlet/src/main/java/com/example/webchicken/modules/backoffice/dao/FeedbackDAO.java`

### 4. Mạch giải thích liền mạch (Storyline của Thành viên 2)
```
[1. Gia nhập gian hàng]  ➔  [2. Đăng bán Dynamic SKU]  ➔  [3. Kiểm duyệt 2 luồng]  ➔  [4. Đóng gói & Giám sát WORM]
(SellerRegister, MST,         (ProductFormModal, SKU,         (Dual-Track Engine, AI          (SellerOrders, Chuỗi lạnh,
 Duyệt đơn, StoreDAO)         MediaUpload, media_files)       quét từ cấm, Admin Products)     Feedbacks, AuditLog WORM)
```
- **Bước 1 (Gia nhập sàn):** Người dùng nộp đơn tại `SellerRegisterPage.tsx` đính kèm chứng nhận VietGAP và mã số thuế ➔ `SellerApplicationServlet` tiếp nhận ➔ `SellerApplicationServiceImpl` lưu vào `seller_applications`. Admin vào `pages/admin/Sellers.tsx` thẩm định hồ sơ ➔ bấm phê duyệt ➔ hệ thống nâng quyền role `SELLER` cho user và khởi tạo bản ghi trong `stores`.
- **Bước 2 (Không gian Seller Center & Đăng sản phẩm biến thể):** Nhà bán đăng nhập vào `SellerLayout.tsx`, kiểm tra số dư tại `SellerDashboardPage.tsx`. Vào `SellerProductListPage.tsx` mở `ProductFormModal.tsx` để đăng bán gà/thực phẩm: upload ảnh qua `MediaUploadServlet` (lưu vào `media_files`), khai báo các biến thể SKU (trọng lượng, quy cách đóng gói, giá tiền minor unit).
- **Bước 3 (Động cơ kiểm duyệt 2 luồng - Dual-Track Moderation Engine):** Dữ liệu sản phẩm gửi lên `SellerProductServlet` ➔ `ProductServiceImpl`:
  - Hệ thống kích hoạt hàm quét tự động `isHealthOrSafetyRisk()` đối chiếu bộ từ khóa `HEALTH_AND_SAFETY_KEYWORDS`:
    - Nếu an toàn: Tự động phê duyệt ➔ Trạng thái `ACTIVE` (lên sàn ngay).
    - Nếu dính từ khóa nguy cơ hoặc chất cấm: Giữ lại ➔ Trạng thái `PENDING_APPROVAL`.
  - Admin vào `pages/admin/Products.tsx` mở `ProductDetailModal.tsx` để thẩm định chứng nhận chất lượng thủ công hoặc dùng `ProductUnhideModal.tsx` để gỡ ẩn sau khi người bán khắc phục.
- **Bước 4 (Vận hành đơn hàng & Thanh tra WORM):** Khi có đơn đặt hàng từ khách, Seller vào `SellerOrdersPage.tsx` xem chi tiết và in phiếu giao hàng chuỗi lạnh qua `SellerOrderDetailModal.tsx` ➔ chuyển trạng thái `CONFIRMED`. Nếu có khúc mắc, Seller gửi khiếu nại qua `SellerFeedbackPage.tsx` để Admin giải quyết trên `AdminFeedbacksPage.tsx`. Toàn bộ hành vi nhạy cảm của Admin (duyệt/từ chối shop, duyệt/khóa sản phẩm) đều được ghi vào bảng bất biến `audit_logs` thông qua `AuditLogServiceImpl` và tra cứu tại `AuditLogsPage.tsx`.

*(👉 **Lời dẫn chuyển giao cho Thành viên 3:** "Sau khi các gian hàng đã hoàn thiện và sản phẩm đạt chuẩn VietGAP đã được niêm yết công khai, tiếp theo xin mời bạn Thành viên 3 trình bày luồng quan trọng nhất của sàn: Trải nghiệm mua sắm của khách hàng, giải thuật khóa kho nguyên tử chống oversell và cổng thanh toán VNPay.")*

---

## 👤 CHI TIẾT THÀNH VIÊN 3: STOREFRONT, GIAO DỊCH, KHÓA KHO & THANH TOÁN (TRANSACTION ENGINE)

### 1. Bảng Database phụ trách (11 Bảng)
1. `categories`: Danh mục ngành hàng phân cấp (id, name, slug, parent_id).
2. `carts`: Giỏ hàng của khách (id, customer_id).
3. `cart_items`: Chi tiết món hàng trong giỏ (id, cart_id, variant_id, quantity).
4. `vouchers`: Mã giảm giá (id, code, discount_type, min_order_value_minor, max_discount_minor, usage_limit).
5. `voucher_usages`: Lịch sử áp dụng mã voucher của khách (id, voucher_id, customer_id, order_id).
6. `inventories`: Quản lý kho hàng (id, sku_id, stock_quantity, reserved_quantity).
7. `stock_reservations`: Bản ghi giữ kho có TTL (id, sku_id, order_id, quantity, expires_at, status [HOLD/RELEASED/COMMITTED]).
8. `order_groups`: Nhóm gom đơn đa shop cho 1 lần thanh toán (id, customer_id, final_amount_minor).
9. `orders`: Đơn hàng chi tiết cho từng shop (id, order_code, order_group_id, store_id, status [PENDING/CONFIRMED/SHIPPING/DELIVERED/CANCELLED]).
10. `order_items`: Chi tiết từng món trong đơn hàng (id, order_id, variant_id, quantity, unit_price_at_purchase_minor).
11. `order_status_histories`: Nhật ký dịch chuyển trạng thái đơn (id, order_id, from_status, to_status, note).
12. `payments`: Bản ghi thanh toán (id, order_id, payment_method [COD/VNPAY], status [UNPAID/PAID/FAILED]).
13. `reviews`: Đánh giá phản hồi sau mua hàng (id, customer_id, product_id, rating, comment).

### 2. Danh mục File Frontend phụ trách (14 Files)
- **Màn hình Mua sắm Storefront:**
  - `frontend-client/src/layouts/StorefrontLayout.tsx`: Header điều hướng, thanh tìm kiếm toàn sàn.
  - `frontend-client/src/pages/storefront/HomePage.tsx`: Trang chủ Flash sale, banner khám phá sản phẩm.
  - `frontend-client/src/pages/storefront/ProductListingPage.tsx`: Bộ lọc đa tiêu chí (danh mục, khoảng giá, rating), phân trang.
  - `frontend-client/src/pages/storefront/ProductDetailPage.tsx`: Chi tiết sản phẩm, chuyển đổi SKU động, cập nhật giá/kho real-time.
  - `frontend-client/src/components/storefront/ProductCard.tsx`: Thẻ hiển thị sản phẩm định dạng VNĐ.
- **Giỏ hàng & Đặt hàng:**
  - `frontend-client/src/pages/storefront/CartPage.tsx`: Giao diện giỏ hàng đầy đủ, gom nhóm theo từng shop.
  - `frontend-client/src/components/storefront/CartDrawer.tsx`: Drawer xem nhanh giỏ hàng ở thanh điều hướng.
  - `frontend-client/src/pages/storefront/CheckoutPage.tsx`: Multi-step checkout, chọn địa chỉ, chống click đúp.
  - `frontend-client/src/components/storefront/VoucherModal.tsx`: Modal chọn mã giảm giá khả dụng.
- **Thanh toán & Hậu mãi:**
  - `frontend-client/src/pages/storefront/PaymentResultPage.tsx`: Màn hình thông báo kết quả giao dịch VNPay & hóa đơn.
  - `frontend-client/src/pages/storefront/OrdersPage.tsx`: Tra cứu lịch sử đơn hàng, timeline trạng thái & hủy đơn.
  - `frontend-client/src/components/storefront/ProductReviews.tsx`: Danh sách đánh giá ở trang chi tiết sản phẩm.
  - `frontend-client/src/components/storefront/ReviewModal.tsx`: Modal cho khách chấm sao (1-5) và viết review sau khi nhận hàng.
- **API Clients phụ trách:** `catalogApi.ts`, `cartApi.ts`, `promotionApi.ts`, `checkoutApi.ts`, `paymentApi.ts`, `orderApi.ts`, `reviewApi.ts`.

### 3. Danh mục Class Backend & Workers phụ trách (23 Classes)
- **Controllers / Servlets:**
  - `backend-servlet/src/main/java/com/example/webchicken/modules/catalog/controller/ProductServlet.java` (nhánh GET public tìm kiếm & chi tiết).
  - `backend-servlet/src/main/java/com/example/webchicken/modules/catalog/controller/CategoryServlet.java`: API cây danh mục hàng hóa.
  - `backend-servlet/src/main/java/com/example/webchicken/modules/cart/controller/CartServlet.java`: Quản lý giỏ hàng.
  - `backend-servlet/src/main/java/com/example/webchicken/modules/promotion/controller/VoucherServlet.java`: Xác thực và áp dụng voucher.
  - `backend-servlet/src/main/java/com/example/webchicken/modules/order/controller/CheckoutServlet.java`: Tiếp nhận yêu cầu tạo đơn hàng.
  - `backend-servlet/src/main/java/com/example/webchicken/modules/order/controller/OrderServlet.java`: Tra cứu đơn của Buyer, hủy đơn.
  - `backend-servlet/src/main/java/com/example/webchicken/modules/payment/controller/PaymentServlet.java`: Khởi tạo thanh toán VNPay & tiếp nhận IPN Webhook.
  - `backend-servlet/src/main/java/com/example/webchicken/modules/review/controller/ReviewServlet.java`: Đăng và đọc đánh giá sản phẩm.
- **Services, Policy & Gateways:**
  - `backend-servlet/src/main/java/com/example/webchicken/modules/catalog/service/CategoryServiceImpl.java`
  - `backend-servlet/src/main/java/com/example/webchicken/modules/cart/service/CartServiceImpl.java`
  - `backend-servlet/src/main/java/com/example/webchicken/modules/promotion/service/VoucherServiceImpl.java`
  - `backend-servlet/src/main/java/com/example/webchicken/modules/inventory/service/InventoryServiceImpl.java` (khóa kho nguyên tử).
  - `backend-servlet/src/main/java/com/example/webchicken/modules/order/service/impl/OrderServiceImpl.java` (giải thuật tách đơn đa shop).
  - `backend-servlet/src/main/java/com/example/webchicken/modules/order/service/OrderStateMachine.java`: Ma trận chuyển đổi trạng thái đơn hàng.
  - `backend-servlet/src/main/java/com/example/webchicken/modules/payment/service/PaymentServiceImpl.java`
  - `backend-servlet/src/main/java/com/example/webchicken/modules/payment/gateway/VNPayGateway.java` (băm chữ ký số HMAC-SHA512).
  - `backend-servlet/src/main/java/com/example/webchicken/modules/review/service/ReviewServiceImpl.java`
- **Background Workers (Hệ thống chạy ngầm đa luồng):**
  - `backend-servlet/src/main/java/com/example/webchicken/bootstrap/ScheduledJobsListener.java`: Thread Pool quản trị vòng đời các job định kỳ.
  - `backend-servlet/src/main/java/com/example/webchicken/infrastructure/worker/ExpiredReservationWorker.java`: Thu hồi tồn kho giữ quá hạn 15 phút.
  - `backend-servlet/src/main/java/com/example/webchicken/infrastructure/worker/ShippingSimulationWorker.java`: Giả lập shipper tự động giao hàng chuỗi lạnh.
  - `backend-servlet/src/main/java/com/example/webchicken/infrastructure/worker/VoucherExpiryWorker.java`: Tự động khóa voucher đã hết hạn.
- **DAOs phụ trách:**
  - `CategoryDAO.java`, `CartDAO.java`, `CartItemDAO.java`
  - `VoucherDAO.java`, `InventoryDAO.java`
  - `OrderDAO.java`, `OrderItemDAO.java`, `OrderGroupDAO.java`, `OrderStatusHistoryDAO.java`, `OrderCancellationDAO.java`
  - `PaymentDAO.java`, `ReviewDAO.java`

### 4. Mạch giải thích liền mạch (Storyline của Thành viên 3)
```
[1. Khám phá & Dynamic SKU]  ➔  [2. Giỏ hàng & Voucher]  ➔  [3. Khóa kho & Tách đơn]  ➔  [4. VNPay & State Machine]  ➔  [5. Hậu mãi & Workers]
(HomePage, ProductDetailPage,     (CartPage, nhóm Shop,       (Atomic Inventory SQL,       (VNPay HMAC, IPN Webhook,     (Review, 3 Worker ngầm,
 SPU/SKU đổi giá tức thì)          VoucherModal, min spend)     TTL 15p, OrderGroup tách N)  OrderStateMachine chuyển P)    Thu hồi kho hết hạn)
```
- **Bước 1 (Khám phá & SKU động):** Người mua vào `StorefrontLayout.tsx` ➔ tìm kiếm ở `ProductListingPage.tsx` ➔ bấm vào chi tiết ở `ProductDetailPage.tsx`. Giải thích kỹ thuật Dynamic SKU: Khi bấm đổi tùy chọn trọng lượng, state FE tự khớp với `product_variants`, hiển thị giá VNĐ tương ứng và số lượng tồn khả dụng tức thì. Bấm "Thêm vào giỏ" ➔ `CartServlet` ➔ `CartServiceImpl` lưu vào `carts` & `cart_items`.
- **Bước 2 (Giỏ hàng gom nhóm & Voucher):** Khách mở `CartDrawer.tsx` hoặc `CartPage.tsx`: Giỏ hàng tự gom nhóm theo từng shop. Mở `VoucherModal.tsx` ➔ gọi `VoucherServlet` ➔ `VoucherServiceImpl` kiểm tra điều kiện `min_order_value_minor`, số lượt dùng còn lại để chiết khấu tiền.
- **Bước 3 (Thao tác Đặt hàng & Khóa kho nguyên tử - Trọng tâm kỹ thuật):** Khách vào `CheckoutPage.tsx` bấm "Đặt hàng" ➔ `CheckoutServlet` gọi `OrderServiceImpl.checkout()`:
  - **Chống bán vượt (Oversell):** Gọi `InventoryDAO` thực thi câu lệnh SQL nguyên tử trực tiếp trong Database:  
    `UPDATE product_variants SET stock_quantity = stock_quantity - ?, reserved_quantity = reserved_quantity + ? WHERE id = ? AND stock_quantity >= ?`.
  - Sinh bản ghi `stock_reservations` có hạn dùng TTL (15 phút).
  - **Tách đơn đa shop:** Gom giỏ hàng dưới 1 mã thanh toán chung `order_group_id`, nhưng tự động tách thành N đơn hàng `orders` cho từng gian hàng (`store_id`), sinh mã đơn ngẫu nhiên bảo mật không đoán được (`order_code`: `ORD-YYYYMMDD-XXXX`).
- **Bước 4 (Cổng thanh toán điện tử VNPay & Máy trạng thái):** Nếu chọn VNPay ➔ `PaymentServlet` gọi `VNPayGateway` ký mã băm HMAC-SHA512 chuyển hướng sang cổng thanh toán Sandbox. Khách thanh toán thành công ➔ VNPay gọi IPN Webhook về `PaymentServlet` ➔ `OrderStateMachine` đẩy trạng thái thanh toán từ `UNPAID` ➔ `PAID`, đẩy đơn hàng sang `CONFIRMED`. Kết quả hiển thị tức thì tại `PaymentResultPage.tsx`.
- **Bước 5 (Hậu mãi & Đa luồng Background Workers):** Khi nhận hàng xong, khách mở `ReviewModal.tsx` tại `OrdersPage.tsx` để chấm điểm 1-5 sao và viết review (lưu vào `reviews`).
  - Điểm nhấn backend: `ScheduledJobsListener` kích hoạt 3 worker chạy ngầm:
    - `ExpiredReservationWorker`: Quá 15 phút khách không thanh toán ➔ tự động nhả kho (`reserved_quantity` trả về `stock_quantity`).
    - `ShippingSimulationWorker`: Giả lập shipper tự động giao hàng chuỗi lạnh theo thời gian thực (`SHIPPING` ➔ `DELIVERED`).
    - `VoucherExpiryWorker`: Quét và vô hiệu hóa voucher hết hạn trong DB.

---
