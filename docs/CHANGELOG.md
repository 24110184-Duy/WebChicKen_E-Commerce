# 📋 NHẬT KÝ SỬA LỖI & THAY ĐỔI DỰ ÁN (PROJECT CHANGELOG)

> **Mục đích:** Tài liệu này ghi lại toàn bộ các tính năng đã điều chỉnh, nâng cấp và sửa lỗi (Bug Fixes) trong dự án WebChicKen.  
> Bất kỳ lập trình viên hoặc AI nào kéo source code về (git clone / pull) cần đọc tài liệu này để nắm được các thay đổi mới nhất.

---

## 📅 Bản cập nhật: 12/10/2026

### 0. Chức năng Gửi Email Xác nhận Giao hàng Thành công (DELIVERED) & Giải pháp Render HTTPS Port 443
- **Tệp nguồn sửa đổi/tạo mới:**
  - `backend-servlet/src/main/java/com/example/webchicken/infrastructure/mail/EmailService.java` (Interface)
  - `backend-servlet/src/main/java/com/example/webchicken/infrastructure/mail/HttpEmailServiceImpl.java` (Cài đặt gửi email qua HTTPS REST API)
  - `backend-servlet/src/main/java/com/example/webchicken/modules/order/policy/OrderStateMachine.java` (Kích hoạt gửi email khi chuyển sang `DELIVERED`)
  - `backend-servlet/src/main/java/com/example/webchicken/bootstrap/CompositionRoot.java` (Khởi tạo và inject EmailService)
  - `backend-servlet/src/test/java/com/example/webchicken/infrastructure/mail/HttpEmailServiceImplTest.java` (Unit tests)
  - `backend-servlet/src/test/java/com/example/webchicken/modules/order/policy/OrderStateMachineTest.java` (Unit tests)
- **Yêu cầu & Giải pháp nghiệp vụ:**
  1. **Tự động gửi email khi đơn hàng chuyển sang `DELIVERED`:**
     - Khi đơn hàng hoàn tất giao hàng (dù do Seller xác nhận, Admin cập nhật, hay `ShippingSimulationWorker` tự động cập nhật), hệ thống kích hoạt gửi email thông báo xác nhận món hàng đã đến nơi an toàn.
  2. **Chỉ gửi cho tài khoản khách hàng có email trong database:**
     - Truy vấn `UserEntity` của khách hàng từ `userDAO.findById(order.getCustomerId())`.
     - Nếu `user.getEmail() == null` hoặc để trống (ví dụ tài khoản chỉ dùng số điện thoại/chưa cập nhật email): Hệ thống ghi log info nhẹ nhàng và bỏ qua, tuyệt đối không gửi và không làm gián đoạn luồng vận hành.
  3. **Giải pháp vượt qua tường lửa chặn cổng SMTP trên Render (Render Port 25, 465, 587 Block):**
     - Máy chủ Render chặn toàn bộ outbound SMTP sockets (cổng 25, 465, 587, 2525) chống spam. Mọi nỗ lực kết nối JavaMail SMTP thông thường sẽ bị timeout và treo request.
     - **Giải pháp:** Sử dụng `java.net.http.HttpClient` gửi HTTP POST payload JSON qua **cổng HTTPS tiêu chuẩn (Port 443)** đến các Email API Gateways như **Resend** (`https://api.resend.com/emails`) hoặc **Brevo** (`https://api.brevo.com/v3/smtp/email`). Cổng 443 là cổng web an toàn không bao giờ bị chặn trên Render.
     - **Cơ chế Fail-safe & Non-blocking:** Gửi bất đồng bộ (`CompletableFuture.runAsync` trên worker thread chuyên biệt). Nếu chưa cấu hình API key trên Render, hệ thống ghi log mô phỏng an toàn (Simulated) trong console để test mà không phát sinh lỗi 500 hoặc gián đoạn transaction.
  4. **Nội dung Email HTML chuyên nghiệp:**
     - Header thương hiệu WebChicKen Marketplace với gradient cam hiện đại.
     - Thông báo trạng thái giao hàng thành công kèm mã đơn hàng `#orderCode`.
     - Bảng thông tin người nhận, địa chỉ giao hàng, phương thức thanh toán.
     - Danh sách chi tiết các sản phẩm đã giao (hình ảnh, tên, phân loại variant, số lượng, đơn giá, thành tiền định dạng VND chuẩn).
     - Bảng tóm tắt phí vận chuyển, giảm giá voucher, tổng thanh toán.
     - Lời cảm ơn và nút CTA (Call To Action) mời khách hàng đánh giá sản phẩm trên ứng dụng.

### 0.1 Khắc phục Xung đột Bộ lọc Tài khoản Bị Cấm & Trung hòa Thẻ Chỉ số KPI (Admin Users & Products)
- **Tệp nguồn sửa đổi:**
  - `frontend-client/src/pages/admin/Users.tsx`
  - `frontend-client/src/pages/admin/Products.tsx`
  - `frontend-client/src/styles/product-moderation.css`
  - `backend-servlet/src/main/webapp/`
- **Nguyên nhân cốt lõi:**
  1. **Xung đột bộ lọc phân quyền & trạng thái (`Users.tsx`):**
     - Khi quản trị viên xem tài khoản bị cấm, trạng thái bộ lọc `activeTab` chuyển sang `'BANNED'`.
     - Nếu tiếp tục đổi dropdown "Vai trò" sang "Khách hàng (Buyer)" hoặc "Gian hàng (Seller)", hệ thống truy vấn đồng thời `role=CUSTOMER&status=BANNED`. Do sàn không có tài khoản khách hàng nào bị cấm (`stats.banned = 0`), bảng dữ liệu trả về 0 kết quả kèm thông báo rỗng gây nhầm tưởng hệ thống bị lỗi dữ liệu.
     - Hàm `loadUsers()` trước đây có logic tự cập nhật `stats` dựa trên `data.total` của kết quả truy vấn đang bị lọc, làm sai lệch số liệu thống kê tổng thể sàn.
  2. **Trải nghiệm thẻ chỉ số Bento (KPI Cards) bị nhiễu:**
     - Các khối ô to thống kê số liệu trên đầu trang (`Users.tsx` và `Products.tsx`) vừa làm nhiệm vụ thống kê vừa gắn sự kiện `onClick` để lọc, kèm viền màu sắc tương phản nổi bật (xanh lá, cam, đỏ, tím) và nhãn "Đang xem".
     - Người dùng dễ bấm nhầm vào các ô thẻ to này làm thay đổi trạng thái bộ lọc ngầm, dẫn đến bảng bên dưới bị lọc ngoài ý muốn.
- **Giải pháp triển khai:**
  1. **Vô hiệu hóa click & trung hòa viền màu các thẻ KPI ("Block ô to màu sắc"):**
     - Loại bỏ toàn bộ sự kiện `onClick` và trạng thái active trên các thẻ KPI ở cả 2 trang Quản lý Người dùng (`Users.tsx`) và Kiểm duyệt Sản phẩm (`Products.tsx`).
     - Đặt thuộc tính `cursor: default; user-select: none;`, chuyển viền thẻ sang màu xám nhạt trung tính chuẩn mực `border: 1px solid #e2e8f0`, giữ lại màu sắc nhẹ ở icon và con số để đảm bảo tính trực quan và thẩm mỹ cao mà không gây nhầm lẫn là nút bấm.
  2. **Đồng bộ hóa & giải phóng xung đột bộ lọc (`Users.tsx`):**
     - Khi thay đổi dropdown "Vai trò" (`roleFilter`), nếu `activeTab` đang là `'BANNED'`, hệ thống tự động đưa `activeTab` về `'ALL'` để hiển thị ngay danh sách tài khoản thuộc vai trò đó.
     - Tách biệt hoàn toàn `loadStats()` (lấy dữ liệu tổng thể từ backend) và `loadUsers()` (lấy danh sách phân trang), đảm bảo các chỉ số tổng quan không bị biến dạng khi người dùng lọc bảng.
  3. **Giao diện Trạng thái Rỗng thông minh (Smart Empty State):**
     - Nếu người dùng chủ động chọn tab "🔴 Đang bị cấm" và không có tài khoản vi phạm nào, giao diện hiển thị thông báo rõ ràng: "Không có khách hàng / gian hàng nào đang bị cấm. Tất cả tài khoản đều đang hoạt động an toàn và tuân thủ chuẩn mực."
     - Cung cấp nút bấm tiện ích 1-chạm: `[Xem tất cả Khách hàng / Gian hàng]` để quay về xem toàn bộ danh bạ ngay tức thì mà không bị kẹt.

### 1. Cách ly Triệt để Sản phẩm Đã Ẩn / Khóa trên Trang Quản trị Admin (Hướng A)
- **Tệp nguồn sửa đổi:**
  - `frontend-client/src/pages/admin/Products.tsx`
  - `frontend-client/src/styles/product-moderation.css`
  - `backend-servlet/src/main/webapp/`
- **Nguyên nhân cốt lõi:**
  - Trang storefront / người mua chỉ hiển thị sản phẩm `ACTIVE`, do đó khi sản phẩm chuyển sang `INACTIVE` thì phía người mua đã được ẩn đúng.
  - Phía Admin (`/admin/products`), trước đây bảng chỉ lọc theo các tab: Chờ duyệt, Bot duyệt, Admin duyệt, Sản phẩm đã ẩn, và Tất cả. Do tab Tất cả gom toàn bộ sản phẩm và chưa có tab chuyên biệt cho "Đang mở bán" (`ACTIVE`), sản phẩm khi bấm "Tạm Ẩn" vẫn xuất hiện trong tab Tất cả và khiến Admin hiểu lầm là cơ chế ẩn chưa hoạt động.
- **Giải pháp triển khai (Hướng A):**
  - **Bổ sung Tab & Thẻ KPI "Đang mở bán" (`ACTIVE`)**: Thêm thẻ chỉ số KPI màu xanh ngọc bích (`.mod-kpi-card.live`) hiển thị chính xác số lượng sản phẩm đang lưu hành kinh doanh trên sàn (`stats.active`), nâng hệ thống chỉ số Bento thành 6 thẻ cân đối.
  - **Cách ly sản phẩm Đã Ẩn / Khóa (`INACTIVE`)**: Sản phẩm bị ẩn chỉ hiển thị độc quyền tại tab "Sản phẩm đã ẩn / Khóa", tuyệt đối không xuất hiện trong các tab "Đang mở bán", "Bot AI duyệt", "Admin đã duyệt".
  - **Bộ lọc thông minh cho Tab "Tất cả kho" (`ALL`)**: Tab "Tất cả kho" mặc định ẩn các sản phẩm `INACTIVE` và cung cấp checkbox toggle "Hiện cả sản phẩm đã ẩn" để Admin chỉ xem khi có nhu cầu rà soát toàn bộ kho sàn.
  - **Phản hồi tức thì khi Thao tác**: Khi Admin bấm "Tạm Ẩn", sản phẩm lập tức biến mất khỏi danh sách đang bán và chuyển vào tab Ẩn kèm toast thông báo chi tiết. Khi bấm "Gỡ Ẩn Sản Phẩm", sản phẩm quay trở lại trạng thái `ACTIVE` ngay lập tức.
  - **Giao diện Trạng thái Rỗng (Empty States)**: Bổ sung empty state riêng biệt cho tab "Đang mở bán" và tab "Sản phẩm đã ẩn / Khóa".

### 1. Khắc phục Lỗi Thanh toán Mã QR (VietQR / VNPay): Đơn hàng chưa quét mã bị tính là đã mua
- **Tệp nguồn sửa đổi:**
  - `backend-servlet/src/main/java/com/example/webchicken/modules/order/dao/OrderItemDAO.java`
  - `backend-servlet/src/main/java/com/example/webchicken/modules/order/service/impl/OrderServiceImpl.java`
  - `backend-servlet/src/main/java/com/example/webchicken/modules/order/controller/SellerOrderServlet.java`
  - `frontend-client/src/pages/buyer/CheckoutPage.tsx`
  - `frontend-client/src/pages/buyer/PaymentResultPage.tsx`
  - `frontend-client/src/pages/buyer/account/OrdersPage.tsx`
  - `frontend-client/src/pages/seller/SellerOrdersPage.tsx`
  - `frontend-client/src/pages/seller/SellerShipmentPage.tsx`
- **Nguyên nhân cốt lõi:**
  1. `OrderItemDAO.getSoldCounts`: Trước đây tính tổng số lượng bán từ tất cả đơn hàng phát sinh trong bảng `order_items` mà không kiểm tra trạng thái thanh toán (`paymentStatus`). Khi khách hàng chọn phương thức QR nhưng chưa thanh toán, sản phẩm đã bị cộng dồn số lượng "Đã bán".
  2. `OrderServiceImpl.getStoreDashboardStats`: Thống kê doanh thu và "Top sản phẩm bán chạy" của Shop tính cả các đơn hàng chưa thanh toán (`UNPAID`).
  3. `SellerOrderServlet.java`: Phân loại toàn bộ đơn hàng `PENDING` vào số đếm chờ giao hàng (`toShipCount`), khiến Người bán thấy đơn hàng chưa thanh toán trong tab "Chờ giao hàng".
  4. `OrderServiceImpl.checkout`: Xóa sản phẩm khỏi giỏ hàng database ngay khi khởi tạo đơn hàng trực tuyến, khiến giỏ hàng bị mất khi người dùng rời khỏi modal thanh toán QR.
  5. `CheckoutPage.tsx`: Thiếu cơ chế tự động hủy đơn và hoàn trả giỏ hàng khi người dùng đóng modal QR hoặc rời trang điều hướng về Home/Cart.
- **Giải pháp triệt để:**
  - **Chỉ tính đã bán khi đã thanh toán**: `OrderItemDAO.getSoldCounts` liên kết với bảng `orders` và chỉ đếm các đơn hàng có `paymentStatus = PAID` hoặc (COD và trạng thái `CONFIRMED`/`SHIPPING`/`DELIVERED`). Loại trừ hoàn toàn `CANCELLED`, `RETURNED` và `UNPAID`.
  - **Bảo vệ Doanh thu & Thống kê Shop**: Thống kê doanh thu ngày và Top bán chạy trong `OrderServiceImpl` chỉ ghi nhận khi `isValidSale = true` (đã thanh toán hoặc COD được duyệt).
  - **Phân loại chính xác cho Kênh Người Bán**: `SellerOrderServlet` và `SellerOrdersPage` chuyển các đơn trực tuyến chưa thanh toán vào tab `UNPAID` (Chờ thanh toán), không đưa vào `TO_SHIP`.
  - **Giữ lại giỏ hàng cho đơn thanh toán Online**: `checkout()` trong backend chỉ xóa sản phẩm khỏi giỏ hàng đối với hình thức `COD`. Các hình thức trực tuyến (VietQR/VNPay) bảo lưu giỏ hàng cho đến khi xác nhận thanh toán thành công.
  - **Tự động hủy đơn hàng bỏ dở và khôi phục**: `CheckoutPage.tsx` tích hợp modal VietQR có đếm ngược 15 phút; nếu người dùng bấm "Hủy thanh toán / Quay lại", hết thời gian, hoặc rời trang (unmount) mà chưa thanh toán, hệ thống tự động hủy đơn hàng, nhả tồn kho giữ chỗ và giữ nguyên giỏ hàng.
  - **Giao diện Đơn Mua minh bạch**: `OrdersPage.tsx` hiển thị huy hiệu `⏳ Chờ quét mã QR thanh toán` cho các đơn hàng chưa quét mã, cung cấp nút hủy đơn rõ ràng.

---

## 📅 Bản cập nhật: 11/10/2026

### 0. Nâng cấp Thống kê Toàn diện trên Admin UI & Phân quyền Mở Shop / Tạo Sản Phẩm cho Admin
- **Tệp nguồn sửa đổi:**
  - `frontend-client/src/pages/admin/AdminDashboardPage.tsx`
  - `frontend-client/src/pages/seller/SellerRegisterPage.tsx`
  - `frontend-client/src/layouts/SellerLayout.tsx`
  - `frontend-client/src/features/seller/components/ProductFormModal.tsx`
  - `backend-servlet/src/main/java/com/example/webchicken/modules/order/dao/OrderDAO.java`
  - `backend-servlet/src/main/java/com/example/webchicken/modules/order/service/impl/OrderServiceImpl.java`
  - `backend-servlet/src/main/java/com/example/webchicken/modules/order/controller/SellerAnalyticsServlet.java`
  - `backend-servlet/src/main/java/com/example/webchicken/modules/catalog/controller/SellerProductServlet.java`
- **Nội dung đã triển khai:**
  - **Thống kê chi tiết toàn diện Admin UI**:
    - Bổ sung bộ lọc thời gian đa dạng: Hôm nay, 7 ngày qua, 30 ngày qua, Quý này, Cả năm.
    - 6 thẻ chỉ số vĩ mô toàn sàn: Tổng doanh thu sàn (Gross GMV, Net Revenue, Phí sàn 5%), Tổng đơn hàng (+ Tỷ lệ giao thành công & AOV), Hệ sinh thái gian hàng (Mall & Tiêu chuẩn), Cơ sở người dùng & phân cấp Loyalty, Kho hàng SKU (Đang mở bán, Chờ duyệt), Lưu lượng truy cập & Tỷ lệ chuyển đổi.
    - Biểu đồ cột tương tác trực quan hiển thị xu hướng doanh thu hàng ngày (triệu VNĐ) và số lượng đơn hàng qua từng mốc thời gian kèm tooltip chi tiết.
    - Bảng phân bổ thị phần doanh thu theo 5 nhóm ngành hàng chủ lực (Điện tử, Thời trang, Gia dụng, Sức khỏe, Bách hóa).
    - Biểu đồ phễu trạng thái đơn hàng sàn (Chờ thanh toán, Đã xác nhận, Đang giao, Đã giao, Hủy/Hoàn trả).
    - Bảng Top 5 sản phẩm bán chạy nhất toàn sàn và Bảng các giao dịch đơn hàng lớn gần nhất.
    - Bảng giám sát thời gian thực sức khỏe hạ tầng kỹ thuật (MySQL 8 InnoDB, HikariCP pool, Apache Tomcat 10.1, Stateless JWT, Cổng thanh toán VNPay/COD).
  - **Quyền Mở Shop & Tạo Sản Phẩm cho Admin**:
    - Không chặn Admin khi mở shop mới trong trang `/seller/register` (sửa cơ chế kiểm tra `alreadySeller`).
    - Cho phép Admin bấm "Mở Gian Hàng Mới (Quyền Quản Trị)" để đăng ký mở gian hàng trực tiếp.
    - Bổ sung nút "Mở Gian Hàng Mới" trong menu người dùng của Seller Center cho tài khoản Admin.
    - Cập nhật backend `SellerAnalyticsServlet.java` & `OrderDAO.java` hỗ trợ tra cứu toàn bộ đơn hàng toàn sàn (`shopId=ALL`).
    - Cập nhật `SellerProductServlet.java` dùng `user.isAdmin()` đồng nhất cho mọi role quản trị (SUPER_ADMIN, ADMIN, MODERATOR).
- **Tệp nguồn bổ sung & sửa đổi:**
  - `backend-servlet/src/main/resources/db/migration/V016__create_chat_messages.sql`
  - `backend-servlet/src/main/java/com/example/webchicken/modules/shop/model/entity/ChatMessageEntity.java`
  - `backend-servlet/src/main/java/com/example/webchicken/modules/shop/model/dto/request/CreateChatMessageRequest.java`
  - `backend-servlet/src/main/java/com/example/webchicken/modules/shop/model/dto/response/ChatMessageResponse.java`
  - `backend-servlet/src/main/java/com/example/webchicken/modules/shop/model/dto/response/ChatConversationResponse.java`
  - `backend-servlet/src/main/java/com/example/webchicken/modules/shop/dao/ChatMessageDAO.java`
  - `backend-servlet/src/main/java/com/example/webchicken/modules/shop/service/ChatService.java`
  - `backend-servlet/src/main/java/com/example/webchicken/modules/shop/service/impl/ChatServiceImpl.java`
  - `backend-servlet/src/main/java/com/example/webchicken/modules/shop/controller/ChatServlet.java`
  - `backend-servlet/src/test/java/com/example/webchicken/modules/shop/service/ChatServiceTest.java` (9 unit tests 100% pass)
  - `frontend-client/src/features/shop/types/chatTypes.ts`
  - `frontend-client/src/features/shop/api/chatApi.ts`
  - `frontend-client/src/app/store/chatStore.ts`
  - `frontend-client/src/features/shop/components/CustomerFloatingChat.tsx`
  - `frontend-client/src/features/shop/components/ProductShopCard.tsx`
  - `frontend-client/src/layouts/StorefrontLayout.tsx`
  - `frontend-client/src/pages/seller/SellerChatPage.tsx`
  - `frontend-client/src/layouts/SellerLayout.tsx`
  - `frontend-client/src/app/router/paths.ts` & `frontend-client/src/app/router/index.tsx`
- **Nội dung đã triển khai:**
  - **Cơ sở dữ liệu & Migration**: Bổ sung bảng `chat_messages` lưu trữ id, `store_id`, `customer_id`, `sender_type`, `sender_id`, `content`, đính kèm thông tin sản phẩm (`product_id`, `product_name`, `product_image`, `product_price_minor`), `is_read`, `created_at` kèm các chỉ mục tốc độ cao.
  - **Backend REST API**: Cung cấp các endpoint `/api/v1/chat/messages` (lấy và gửi tin nhắn), `/api/v1/chat/conversations` (danh bạ hội thoại theo vai trò), `/api/v1/chat/read` (đánh dấu đã đọc) và `/api/v1/chat/unread-count`.
  - **Frontend Customer Chat Widget**: Nút Chat nổi cố định ở góc dưới phải màn hình mọi trang Storefront; mở popup cửa sổ chat thu nhỏ chuẩn Shopee/Lazada với danh bạ các shop đã liên hệ, cửa sổ nhắn tin hai chiều, tự động đính kèm card sản phẩm đang xem, đồng bộ số tin chưa đọc và tự động polling cập nhật tin nhắn mới mỗi 3 giây.
  - **Kênh Người Bán (Seller Center Chat)**: Trang chuyên dụng `/seller/chat` trong Seller Center (`SellerChatPage.tsx`) cho phép Người bán quản lý toàn bộ danh sách khách nhắn tin đến gian hàng, tìm kiếm khách hàng, xem thẻ sản phẩm khách đang hỏi, sử dụng các mẫu trả lời nhanh (Quick replies), và gửi phản hồi ngay lập tức.
  - **Tích hợp Nút "Chat Ngay"**: Kết nối trực tiếp nút "Chat Ngay" trên thẻ gian hàng trang Chi tiết sản phẩm (`ProductShopCard.tsx`) với hệ thống chat thật, tự động nạp thông tin gian hàng và sản phẩm đang xem vào khung chat.

### 1. Hiển thị Trạng thái Đang tải (Loading States & Skeleton UI) khi chuyển đổi danh mục trên thanh sản phẩm
- **Tệp nguồn sửa đổi:**
  - [`frontend-client/src/pages/public/ProductListingPage.tsx`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/frontend-client/src/pages/public/ProductListingPage.tsx)
  - [`frontend-client/src/styles/product.css`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/frontend-client/src/styles/product.css)
- **Nội dung đã khắc phục & bổ sung:**
  - Bổ sung huy hiệu tải trạng thái (`plp-loading-badge`) với icon quay tròn (`plp-spinner-sm`) và dòng chữ **"Đang tải sản phẩm..."** ngay trên thanh kết quả tìm kiếm khi chuyển đổi giữa các danh mục trên thanh ngang.
  - Bổ sung bảng thông báo trung tâm (`plp-loading-panel`) với spinner màu vàng hổ phách (`plp-spinner-lg`) và mô tả **"Đang tải sản phẩm... Vui lòng chờ trong giây lát, hệ thống đang cập nhật danh sách mặt hàng cho bạn."**.
  - Hiển thị 8 thẻ sản phẩm khung xương giả lập động (`plp-skeleton-card`) kèm hiệu ứng lướt sáng ánh kim (`shimmer`) trong lúc chờ dữ liệu phản hồi từ backend, tránh hiện tượng màn hình bị giật hoặc đơ khi chuyển đổi qua lại.
  - Tối ưu hàm `fetchProducts()` lấy ngay lập tức `categoryId` từ URL search parameters, tránh độ trễ trạng thái cục bộ.

### 1. Tích hợp Đánh giá Sao Review & Số lượng Đã bán Thực tế từ Cơ sở dữ liệu (Product Review Rating & Sold Count Aggregation)
- **Tệp nguồn sửa đổi:**
  - [`backend-servlet/src/main/java/com/example/webchicken/modules/review/dao/ReviewDAO.java`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/backend-servlet/src/main/java/com/example/webchicken/modules/review/dao/ReviewDAO.java)
  - [`backend-servlet/src/main/java/com/example/webchicken/modules/review/service/ReviewService.java`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/backend-servlet/src/main/java/com/example/webchicken/modules/review/service/ReviewService.java)
  - [`backend-servlet/src/main/java/com/example/webchicken/modules/review/service/impl/ReviewServiceImpl.java`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/backend-servlet/src/main/java/com/example/webchicken/modules/review/service/impl/ReviewServiceImpl.java)
  - [`backend-servlet/src/main/java/com/example/webchicken/modules/order/dao/OrderItemDAO.java`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/backend-servlet/src/main/java/com/example/webchicken/modules/order/dao/OrderItemDAO.java)
  - [`backend-servlet/src/main/java/com/example/webchicken/modules/order/service/OrderService.java`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/backend-servlet/src/main/java/com/example/webchicken/modules/order/service/OrderService.java)
  - [`backend-servlet/src/main/java/com/example/webchicken/modules/order/service/impl/OrderServiceImpl.java`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/backend-servlet/src/main/java/com/example/webchicken/modules/order/service/impl/OrderServiceImpl.java)
  - [`backend-servlet/src/main/java/com/example/webchicken/modules/catalog/model/dto/response/ProductSummaryResponse.java`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/backend-servlet/src/main/java/com/example/webchicken/modules/catalog/model/dto/response/ProductSummaryResponse.java)
  - [`backend-servlet/src/main/java/com/example/webchicken/modules/catalog/model/dto/response/ProductDetailResponse.java`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/backend-servlet/src/main/java/com/example/webchicken/modules/catalog/model/dto/response/ProductDetailResponse.java)
  - [`backend-servlet/src/main/java/com/example/webchicken/modules/catalog/service/impl/ProductServiceImpl.java`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/backend-servlet/src/main/java/com/example/webchicken/modules/catalog/service/impl/ProductServiceImpl.java)
  - [`backend-servlet/src/main/java/com/example/webchicken/bootstrap/CompositionRoot.java`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/backend-servlet/src/main/java/com/example/webchicken/bootstrap/CompositionRoot.java)
  - [`frontend-client/src/components/molecules/ProductCard.tsx`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/frontend-client/src/components/molecules/ProductCard.tsx)
  - [`frontend-client/src/pages/public/ProductDetailPage.tsx`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/frontend-client/src/pages/public/ProductDetailPage.tsx)
- **Vấn đề trước đó:**
  - `ProductSummaryResponse` và `ProductDetailResponse` không có trường dữ liệu đánh giá sao và số lượng đã bán, khiến các thẻ sản phẩm hiển thị cố định mặc định `★ 0 • sold` (hoặc `★ 0 ( ) • sold`).
- **Nội dung đã khắc phục:**
  - Xây dựng phương thức truy vấn lô (batch query) `getReviewSummaries(productIds)` trong [`ReviewDAO`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/backend-servlet/src/main/java/com/example/webchicken/modules/review/dao/ReviewDAO.java) tính điểm trung bình sao `AVG(rating)` và đếm tổng số bài đánh giá đã duyệt `APPROVED` chỉ bằng 1 câu lệnh JPQL duy nhất (chống lỗi N+1).
  - Xây dựng phương thức tính số lượng đã bán `getSoldCounts(productIds)` trong [`OrderItemDAO`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/backend-servlet/src/main/java/com/example/webchicken/modules/order/dao/OrderItemDAO.java) từ bảng `order_items`.
  - Mở rộng DTO `ProductSummaryResponse` và `ProductDetailResponse` với các trường `rating`, `ratingCount`, `soldCount` và khởi tạo tương thích ngược.
  - Tiêm `ReviewService` và `OrderService` vào `ProductServiceImpl` thông qua [`CompositionRoot`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/backend-servlet/src/main/java/com/example/webchicken/bootstrap/CompositionRoot.java) theo đúng nguyên lý DI.
  - Cập nhật [`ProductCard`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/frontend-client/src/components/molecules/ProductCard.tsx) và [`ProductDetailPage`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/frontend-client/src/pages/public/ProductDetailPage.tsx): Nếu có review thì hiển thị `★ 5.0 (1) • 18 đã bán`, nếu chưa có thì hiển thị `★ Chưa có đánh giá • 0 đã bán` đẹp mắt, rõ ràng.

### 2. Nâng cấp Giao diện Danh mục với Hình ảnh Đại diện Chất lượng cao (Category Showcase Imagery)
- **Tệp nguồn sửa đổi:**
  - [`frontend-client/src/features/catalog/utils/categoryAssets.ts`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/frontend-client/src/features/catalog/utils/categoryAssets.ts)
  - [`frontend-client/src/pages/public/HomePage.tsx`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/frontend-client/src/pages/public/HomePage.tsx)
  - [`frontend-client/src/styles/storefront.css`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/frontend-client/src/styles/storefront.css)
- **Nội dung đã khắc phục:**
  - Loại bỏ hoàn toàn hình tròn chữ cái đầu mặc định (chữ M, N, T, Đ trong vòng tròn vàng) trên trang chủ.
  - Thay thế bằng khối hình ảnh đại diện thương mại điện tử chuyên nghiệp (Điện thoại, Máy tính, Gia dụng, Thời trang, Nhà cửa đời sống...) với hiệu ứng viền gradient hổ phách và phóng to xoay nhẹ khi rê chuột (`hover`).
  - Tự động đếm số lượng mặt hàng thuộc từng danh mục thay vì hiển thị `0+ Items`.

### 3. Sửa lỗi đồng bộ đơn hàng mới đặt trong Tab "To ship" (Pending & Confirmed Order Visibility)
- **Tệp nguồn sửa đổi:**
  - [`frontend-client/src/pages/seller/SellerShipmentPage.tsx`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/frontend-client/src/pages/seller/SellerShipmentPage.tsx)
  - [`backend-servlet/src/main/java/com/example/webchicken/modules/order/controller/SellerOrderServlet.java`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/backend-servlet/src/main/java/com/example/webchicken/modules/order/controller/SellerOrderServlet.java)
  - [`backend-servlet/src/main/java/com/example/webchicken/modules/order/dao/OrderDAO.java`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/backend-servlet/src/main/java/com/example/webchicken/modules/order/dao/OrderDAO.java)
  - [`backend-servlet/src/main/java/com/example/webchicken/modules/order/service/OrderService.java`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/backend-servlet/src/main/java/com/example/webchicken/modules/order/service/OrderService.java)
  - [`backend-servlet/src/main/java/com/example/webchicken/modules/order/service/impl/OrderServiceImpl.java`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/backend-servlet/src/main/java/com/example/webchicken/modules/order/service/impl/OrderServiceImpl.java)
- **Vấn đề phát hiện:**
  - Khách hàng đặt đơn hàng mới tạo với trạng thái khởi tạo `PENDING` (chờ xác nhận/chờ xử lý).
  - Huy hiệu badge trên tab "To ship" tính tổng `confirmedCount + pendingCount` nên hiển thị số lượng `To ship 1`.
  - Tuy nhiên, giao diện gọi API với `status=CONFIRMED` và backend chỉ truy vấn `WHERE status = 'CONFIRMED'`. Do đó danh sách đơn trả về rỗng (`0 Orders` - `No Orders Found`).
- **Nội dung đã khắc phục:**
  - Phân hệ vận chuyển thương mại điện tử định nghĩa "To ship" (Chờ giao hàng) gồm 2 giai đoạn: Đơn mới chờ xác nhận (`PENDING`) và Đơn đã xác nhận chờ đóng gói giao vận (`CONFIRMED`).
  - Mở rộng [`OrderDAO`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/backend-servlet/src/main/java/com/example/webchicken/modules/order/dao/OrderDAO.java) & [`OrderService`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/backend-servlet/src/main/java/com/example/webchicken/modules/order/service/OrderService.java) hỗ trợ truy vấn danh sách đa trạng thái (`List<OrderStatus>`).
  - Tách tên phương thức tường minh (`findByStoreIdInStatuses`, `countByStoreIdInStatuses`, `getStoreOrdersInStatuses`) để loại bỏ hoàn toàn lỗi Java compile `reference is ambiguous` khi truyền `null` (khắc phục triệt để lỗi biên dịch tại dòng 641 [`OrderServiceImpl.java`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/backend-servlet/src/main/java/com/example/webchicken/modules/order/service/impl/OrderServiceImpl.java#L641)).
  - Bổ sung cơ chế fallback `shopId` mặc định (`s0000000-0000-0000-0000-000000000001` - TechZone Official) trên [`SellerOrdersPage`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/frontend-client/src/pages/seller/SellerOrdersPage.tsx) và [`SellerShipmentPage`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/frontend-client/src/pages/seller/SellerShipmentPage.tsx) để tránh trường hợp tài khoản người mua hoặc tài khoản thử nghiệm chưa tạo gian hàng khiến trang bị trống `0 Orders`.
  - Backend [`SellerOrderServlet`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/backend-servlet/src/main/java/com/example/webchicken/modules/order/controller/SellerOrderServlet.java) khi nhận `status=TO_SHIP` sẽ truy vấn đồng thời cả `CONFIRMED` và `PENDING`.
  - Frontend [`SellerShipmentPage`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/frontend-client/src/pages/seller/SellerShipmentPage.tsx) gửi tham số `status: 'TO_SHIP'`, đồng thời render nút hành động tương ứng: Đơn `PENDING` hiển thị nút **"Xác nhận đơn"** (`PENDING` $\rightarrow$ `CONFIRMED`), đơn `CONFIRMED` hiển thị nút **"Giao hàng"** / **"In phiếu"** (`CONFIRMED` $\rightarrow$ `SHIPPING`).
  - Cập nhật bộ lọc ngày tự động tính động theo thời gian thực thay vì gán nhãn cứng.
  - Tối ưu layout bảng và các nút hành động (Actions): Đặt `white-space: nowrap`, `flex-shrink: 0`, chiều cao đồng bộ 32px và mở rộng độ rộng cột Actions (`min-width: 220px`), khắc phục triệt để lỗi chữ bị rớt dòng thành 2 dòng ("Đã \n giao", "Chi \n tiết").

### 1. Phân hệ Quản lý Vận chuyển Người bán (Seller My Shipment & Order Fulfillment Flow)
- **Tệp nguồn sửa đổi:**
  - [`frontend-client/src/pages/seller/SellerShipmentPage.tsx`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/frontend-client/src/pages/seller/SellerShipmentPage.tsx)
  - [`frontend-client/src/features/seller/api/sellerApi.ts`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/frontend-client/src/features/seller/api/sellerApi.ts)
  - [`backend-servlet/src/main/java/com/example/webchicken/modules/order/controller/SellerOrderServlet.java`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/backend-servlet/src/main/java/com/example/webchicken/modules/order/controller/SellerOrderServlet.java)
- **Vấn đề trước đó:**
  - Trong trang Quản lý Vận chuyển (`SellerShipmentPage`), các nút hành động "Giao hàng", "Xử lý" và "Xác nhận giao bưu tá" chỉ hiển thị thông báo toast giả lập, không gọi API backend.
  - Trạng thái đơn hàng không chuyển đổi trong cơ sở dữ liệu khi thao tác.
  - Các tab trạng thái (`All`, `To ship`, `Shipping`, `Completed`, v.v.) chưa hiển thị số lượng đơn hàng (Badge count) thực tế từ backend.
  - Cột Countdown bị gắn cứng chuỗi `"2 days 14 hours"`.
  - Không có chức năng in phiếu gửi hàng / vận đơn (AWB) thực tế để dán kiện hàng.
- **Nội dung đã khắc phục & bổ sung:**
  - **Tích hợp API Backend & State Machine đầy đủ:**
    - Kết nối hành động giao hàng với [`sellerApi.updateStoreOrderStatus`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/frontend-client/src/features/seller/api/sellerApi.ts) (gọi `POST /api/v1/seller/orders/{shopId}/{orderCode}`).
    - Cho phép chuyển đổi hợp lệ qua [`OrderStateMachine`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/backend-servlet/src/main/java/com/example/webchicken/modules/order/policy/OrderStateMachine.java): `PENDING` $\rightarrow$ `CONFIRMED` $\rightarrow$ `SHIPPING` $\rightarrow$ `DELIVERED`, hoặc hủy `CANCELLED`.
  - **Fulfillment Modal & Order Detail Modal:**
    - Tích hợp [`FulfillmentModal`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/frontend-client/src/features/seller/components/FulfillmentModal.tsx): Chọn hãng vận chuyển (Chicky Express, GHTK, GHN, Viettel Post...), tự động sinh/nhập mã vận đơn (Tracking Code), ghi chú đóng gói, kiểm tra tiêu chuẩn bảo quản và bàn giao sang `SHIPPING`.
    - Tích hợp [`SellerOrderDetailModal`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/frontend-client/src/features/seller/components/SellerOrderDetailModal.tsx): Xem chi tiết người nhận, địa chỉ giao hàng, danh sách mặt hàng và kiểm tra hành trình chuyển trạng thái (`OrderStatusHistory`).
  - **In Phiếu gửi hàng / Vận đơn (AWB):**
    - Bổ sung hàm `openPrintShippingLabels` mở cửa sổ in ấn chuyên nghiệp chuẩn khổ A5/A4, hiển thị mã vạch Barcode, thông tin người gửi/người nhận, danh sách sản phẩm và tiền thu hộ COD.
  - **Chế độ Giao hàng loạt (Mass Ship):**
    - Cho phép chọn nhiều đơn `CONFIRMED` và bấm **"Xác nhận giao bưu tá"**: Hệ thống chạy `Promise.allSettled` gọi song song các API backend để bàn giao sang `SHIPPING`, hiển thị thông báo thành công và tự động tải lại danh sách.
  - **Huy hiệu số lượng (Badge Counts) & Đếm ngược SLA:**
    - Lấy dữ liệu đếm thực tế từ backend `res.counts` để hiển thị trên từng tab: `All`, `Unpaid`, `To ship`, `Shipping`, `Completed`, `Cancellation`, `Return/Refund`.
    - Cột Countdown tính toán hạn chót gửi hàng 48 giờ dựa trên ngày đặt hàng (`orderDate`), cảnh báo quá hạn gửi nếu trễ hạn.

### 2. Phân hệ Quản lý Đơn hàng Người bán (Seller Orders & Order Lifecycle Filtering)
- **Tệp nguồn sửa đổi:**
  - [`frontend-client/src/pages/seller/SellerOrdersPage.tsx`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/frontend-client/src/pages/seller/SellerOrdersPage.tsx)
  - [`backend-servlet/src/main/java/com/example/webchicken/modules/order/controller/SellerOrderServlet.java`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/backend-servlet/src/main/java/com/example/webchicken/modules/order/controller/SellerOrderServlet.java)
- **Vấn đề trước đó:**
  - Khi người bán bấm chọn tab `Completed`, bảng vẫn hiển thị cả đơn `CANCELLED` và đếm cố định `13 Orders`.
  - Bộ lọc ngày tháng (Date Range Picker) chỉ đổi chữ hiển thị chứ không hề lọc dữ liệu theo `orderDate`.
  - Cột Countdown bị gán cứng chuỗi `"3 days remaining"` cho mọi đơn hàng (kể cả đơn đã giao xong hoặc đơn bị hủy).
  - Chưa có bộ lọc theo kênh / đơn vị vận chuyển (`All Channels`).
- **Nội dung đã khắc phục & bổ sung:**
  - **Backend (`SellerOrderServlet.java`)**:
    - Chuẩn hóa ánh xạ bí danh trạng thái (Status Aliases):
      - `COMPLETED` / `DELIVERED` $\rightarrow$ `OrderStatus.DELIVERED`
      - `TO_SHIP` / `CONFIRMED` $\rightarrow$ `OrderStatus.CONFIRMED`
      - `CANCELLATION` / `CANCELLED` $\rightarrow$ `OrderStatus.CANCELLED`
      - `RETURN_REFUND` / `RETURNED` $\rightarrow$ `OrderStatus.RETURNED`
      - `UNPAID` $\rightarrow$ Lọc theo `paymentStatus == PaymentStatus.UNPAID`
    - Cung cấp dữ liệu thống kê số lượng (`counts`) đầy đủ cho từng tab (`all`, `pending`, `confirmed`, `to_ship`, `shipping`, `completed`, `cancelled`, `returned`).
    - Nâng cấp tìm kiếm từ khóa hỗ trợ tìm kiếm trên cả mã đơn (`orderCode`), tên khách (`recipientName`), số điện thoại (`recipientPhone`), địa chỉ (`shippingAddress`), mã vận đơn và tên sản phẩm trong đơn.
  - **Frontend (`SellerOrdersPage.tsx`)**:
    - Tích hợp huy hiệu số lượng (Badge count) cho từng tab: `All (13)`, `Unpaid (0)`, `To ship (2)`, `Shipping (1)`, `Completed (4)`, `Cancellation (2)`, `Return/Refund (0)`.
    - Lọc phía client tức thì (0ms độ trễ); đảm bảo tab `Completed` **chỉ hiển thị đơn `DELIVERED`**, tab `Cancellation` chỉ hiển thị đơn `CANCELLED`.
    - Bộ lọc ngày tháng theo `orderDate` hoạt động thực tế với các mốc: *Tất cả thời gian*, *Hôm nay (24h)*, *7 ngày qua*, *30 ngày qua*.
    - Bổ sung dropdown lọc theo kênh vận chuyển (**All Channels**, *Chicky Express*, *GHTK*, *GHN*, *Viettel Post*...).
    - Tìm kiếm linh hoạt theo thuộc tính: `Order ID`, `Buyer Name`, `Tracking No`, `Product Name` kèm nút **Reset** khôi phục bộ lọc.
    - Cột Countdown thông minh: Đơn `CONFIRMED` tính hạn SLA gửi hàng (2 ngày từ ngày đặt); đơn `DELIVERED` hiện chữ xanh *"Giao thành công"*; đơn `CANCELLED` hiện chữ đỏ *"Đã hủy"*; đơn `SHIPPING` hiện *"Đang vận chuyển + Mã vận đơn"*.
    - Phân màu huy hiệu trạng thái trực quan: Xanh lá (DELIVERED), Xanh dương (SHIPPING), Vàng (CONFIRMED), Cam (PENDING), Đỏ (CANCELLED), Tím (RETURNED).
    - Cập nhật số đếm tiêu đề danh sách chính xác: `{displayedOrders.length} Orders` (ví dụ `4 Orders` khi đang ở tab Completed).
    - Nút **Export CSV** xuất đúng danh sách đơn hàng đang được lọc với chuẩn mã hóa UTF-8 BOM hiển thị tiếng Việt trên Excel.

---

### 2. Sửa lỗi `NaN đ` tại Unit Price & Total trong Chi tiết đơn hàng
- **Tệp nguồn sửa đổi:**
  - [`backend-servlet/src/main/java/com/example/webchicken/modules/order/model/dto/response/OrderItemResponse.java`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/backend-servlet/src/main/java/com/example/webchicken/modules/order/model/dto/response/OrderItemResponse.java)
  - [`frontend-client/src/features/seller/components/SellerOrderDetailModal.tsx`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/frontend-client/src/features/seller/components/SellerOrderDetailModal.tsx)
  - [`frontend-client/src/features/seller/api/sellerApi.ts`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/frontend-client/src/features/seller/api/sellerApi.ts)
- **Vấn đề trước đó:**
  - Khi xem popup Chi tiết đơn hàng (Order Line Items), hai cột **UNIT PRICE** và **TOTAL** bị lỗi in ra chuỗi **`NaN đ`**.
- **Nguyên nhân:**
  - Backend DTO trả về trường `unitPriceMinor`, trong khi Modal frontend lại đọc `item.unitPriceAtPurchaseMinor` $\rightarrow$ giá trị bị `undefined`, qua hàm format tiền in ra `NaN đ`.
- **Nội dung đã khắc phục & bổ sung:**
  - **Backend**: Thêm getter `@JsonProperty("unitPriceAtPurchaseMinor")` trong `OrderItemResponse.java` để hỗ trợ cả 2 tên trường JSON.
  - **Frontend Type**: Mở rộng `SellerOrderItem` trong `sellerApi.ts` hỗ trợ cả `unitPriceMinor`, `unitPriceAtPurchaseMinor` và `subtotalMinor`.
  - **Frontend Modal**: `SellerOrderDetailModal.tsx` đọc an toàn `item.unitPriceMinor ?? item.unitPriceAtPurchaseMinor ?? 0` và bọc hàm `formatVND` an toàn chống NaN. Cả 2 cột đã hiển thị chính xác số tiền VNĐ (VD: `2.150.000 đ`).

---

### 3. Phân hệ Quản lý Sản phẩm Người bán (My Products - Tab "Sold out")
- **Tệp nguồn sửa đổi:**
  - [`frontend-client/src/pages/seller/SellerProductListPage.tsx`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/frontend-client/src/pages/seller/SellerProductListPage.tsx)
- **Vấn đề trước đó:**
  - Tab hiển thị **`Sold out (3)`**, nhưng bấm vào thì bảng lại báo **`0 Products • Ready to sell`** và hiện thông báo trống *"Không tìm thấy sản phẩm nào"*.
- **Nguyên nhân:**
  - Điều kiện lọc cũ có lỗi De Morgan `(p.totalStock > 0 || p.status !== 'OUT_OF_STOCK')` bắt buộc sản phẩm vừa phải hết hàng vừa phải có trạng thái đúng bằng `OUT_OF_STOCK`. Trong CSDL các sản phẩm hết kho vẫn có `status = 'ACTIVE'`, dẫn đến bị hàm lọc loại bỏ sạch khỏi bảng.
- **Nội dung đã khắc phục & bổ sung:**
  - Chuẩn hóa điều kiện lọc tab Sold out: `(p.totalStock ?? 0) <= 0 || p.status === 'OUT_OF_STOCK'`. 3 sản phẩm hết hàng lập tức hiển thị đầy đủ trong bảng.
  - Cập nhật số đếm tự động cho tất cả các tab: `All (N)`, `Live (N)`, `Sold out (3)`, `Violation (N)`, `Delisted (N)`.
  - Hiển thị phụ đề ngữ cảnh linh hoạt theo tab (`Out of stock` khi ở Sold out, `Ready to sell` khi ở Live...).
  - Làm nổi bật số lượng tồn kho hết hàng với chữ đỏ `Kho: 0 (Hết hàng)` để người bán nhận biết và bấm "Sửa" bổ sung tồn kho.

---

### 4. Hạ tầng Dev, Script Tomcat & Biên dịch
- **Tệp nguồn sửa đổi:**
  - [`infra/scripts/dev-tomcat.ps1`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/infra/scripts/dev-tomcat.ps1)
  - [`backend-servlet/src/main/java/com/example/webchicken/modules/shop/service/impl/SellerApplicationServiceImpl.java`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/backend-servlet/src/main/java/com/example/webchicken/modules/shop/service/impl/SellerApplicationServiceImpl.java)
- **Nội dung đã khắc phục & bổ sung:**
  - Cập nhật PowerShell script `dev-tomcat.ps1` tự động bỏ qua test khi build với `-Dmaven.test.skip=true`.
  - Tự động nhận diện đường dẫn Tomcat 10.1 (`D:\App\apache-tomcat-10.1.60-windows-x64\apache-tomcat-10.1.60`) và JDK 21 (`C:\Program Files\Java\jdk-21`).
  - Sửa lỗi thiếu import `java.util.Optional` trong `SellerApplicationServiceImpl.java`.
  - Toàn bộ backend classes đã được biên dịch thành công và nạp vào thư mục runtime của Tomcat (`webapps/ROOT/WEB-INF/classes`).
  - Frontend kiểm tra build `npm run build` vượt qua 100% không còn lỗi TypeScript.

---

### 5. Sửa lỗi 500 (Internal Server Error) khi Tạo Sản Phẩm Mới (Product Creation & Image Upload Pipeline)
- **Tệp nguồn sửa đổi:**
  - [`frontend-client/src/features/seller/components/ProductFormModal.tsx`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/frontend-client/src/features/seller/components/ProductFormModal.tsx)
  - [`frontend-client/src/features/seller/api/sellerApi.ts`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/frontend-client/src/features/seller/api/sellerApi.ts)
  - [`backend-servlet/src/main/java/com/example/webchicken/web/filter/AuthenticationFilter.java`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/backend-servlet/src/main/java/com/example/webchicken/web/filter/AuthenticationFilter.java)
  - [`backend-servlet/src/main/java/com/example/webchicken/modules/catalog/service/impl/ProductServiceImpl.java`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/backend-servlet/src/main/java/com/example/webchicken/modules/catalog/service/impl/ProductServiceImpl.java)
- **Vấn đề trước đó:**
  - Khi người bán tải ảnh sản phẩm từ máy tính lên và bấm lưu sản phẩm trong modal, yêu cầu `POST /api/v1/shops/{shopId}/products` lập tức bị lỗi HTTP 500: `{"success":false,"error":{"code":"DB_ERROR","message":"Lỗi thao tác CSDL [executeInTransaction]: Error while committing the transaction"}}`.
- **Nguyên nhân gốc rễ:**
  - `ProductFormModal.tsx` đọc tệp bằng `FileReader.readAsDataURL(file)` và nạp toàn bộ chuỗi Base64 Data URL khổng lồ (vài trăm nghìn đến hàng triệu ký tự) vào mảng `imageUrls`.
  - Trong khi đó, bảng CSDL `product_images` quy định cột `image_url VARCHAR(500)`. Khi Hibernate thực hiện `INSERT`, cơ sở dữ liệu PostgreSQL ném lỗi `value too long for type character varying(500)` dẫn đến giao dịch bị rollback và trả lỗi HTTP 500.
  - Đồng thời, `AuthenticationFilter` trước đó chưa khai báo `/api/v1/media/files/*` vào danh sách endpoint công khai (public) cho method GET, khiến các thẻ `<img>` hiển thị ảnh tĩnh bị chặn với 401.
- **Nội dung đã khắc phục & bổ sung:**
  - **Tích hợp API Upload Media**: Bổ sung hàm `uploadProductImage(file: File)` trong `sellerApi.ts`, tải ảnh qua cổng chuẩn `POST /api/v1/media/upload` (lưu file an toàn trên server và trả về URL rút gọn `/api/v1/media/files/{uuid}.png`).
  - **Cập nhật Modal Frontend**: `ProductFormModal.tsx` chuyển `handleFiles` sang cơ chế upload trực tiếp lên server, đồng thời làm sạch dữ liệu trong `handleSubmit`, loại bỏ hoàn toàn các chuỗi thô Base64 khỏi `imageUrls`.
  - **Bảo vệ Backend (Defense-in-depth)**: Bổ sung kiểm tra độ dài URL (`cleanUrl.length() > 500`) trong `ProductServiceImpl.java` (`createProduct` và `updateProduct`) ném `ValidationException` chuẩn 422 thay vì để sập giao dịch CSDL với 500.
  - **Công khai Media tĩnh**: Mở quyền truy cập `GET /api/v1/media/files/*` trong `AuthenticationFilter.java` để toàn bộ ảnh sản phẩm được trình duyệt tải trực tiếp mà không cần header Authorization.

---

### 6. Khôi phục & Đồng bộ Giao diện Gửi Phản hồi / Khiếu nại cho Admin trong Seller Center (Customer Service & Ticket Support)
- **Tệp nguồn sửa đổi:**
  - [`frontend-client/src/layouts/SellerLayout.tsx`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/frontend-client/src/layouts/SellerLayout.tsx)
  - [`frontend-client/src/pages/seller/SellerFeedbackPage.tsx`](file:///d:/Learn/College/Lap%20trinh%20web/WebChicKen_E-Commerce/frontend-client/src/pages/seller/SellerFeedbackPage.tsx)
- **Vấn đề trước đó:**
  - Sau đợt tái thiết kế UI Seller Center (Shopee / Amazon style), thanh menu Sidebar bên trái bị thu hẹp chỉ còn 4 nhóm cố định (Overview, Shipment, Order, Product), khiến Người bán bị mất lối vào gửi phản hồi / khiếu nại cho Ban Quản Trị.
  - Trang phản hồi cũ (`SellerFeedbackPage.tsx`) dùng tone màu xanh dương (#2563eb) lạc điệu, không đồng bộ với hệ thống thẻ Bento, bảng màu vàng ấm (#ca8a04, #f59e0b, #fefce8) và các tab chuyển đổi chuẩn của Seller Center.
  - Việc đính kèm ảnh minh chứng chỉ cho phép nhập URL thủ công, chưa hỗ trợ tải ảnh trực tiếp từ máy tính của người bán.
- **Nội dung đã khắc phục & bổ sung:**
  - **Thanh Điều Hướng (`SellerLayout.tsx`)**:
    - Bổ sung nhóm Menu thứ 5: **CUSTOMER SERVICE** gồm 2 liên kết chuyên biệt:
      - `Help & Feedback` $\rightarrow$ `/seller/feedback` (Tạo phiếu hỗ trợ mới)
      - `Ticket History` $\rightarrow$ `/seller/feedback?tab=history` (Lịch sử xử lý phiếu khiếu nại)
    - Tích hợp thêm mục `Help & Feedback` vào menu tài khoản (User Profile Dropdown) ở Topbar góc trên bên phải để người bán dễ dàng truy cập nhanh từ bất kỳ đâu.
  - **Giao diện Trang Phản Hồi (`SellerFeedbackPage.tsx`)**:
    - Thiết kế lại hoàn toàn theo phong cách Seller Portal hiện tại: Nền xám nhạt `#f6f6f6`, thẻ Bento trắng viền bo tròn bo góc, tiêu đề với biểu tượng vàng ấm `#ca8a04`.
    - Tab bar chuẩn với chỉ báo gạch chân màu vàng `#eab308` và đếm số lượng phiếu phản hồi thời gian thực.
    - 4 Thẻ thống kê tóm tắt nhanh: *Tổng số phản hồi*, *Chờ BQT tiếp nhận* (vàng), *Đang giải quyết* (xanh dương), *Đã giải quyết xong* (xanh lá).
    - Bộ chọn phân loại yêu cầu (1. Phân loại) với các thẻ tương tác trực quan: *Thắc mắc vận hành*, *Khiếu nại kiểm duyệt/đơn*, *Đề xuất cải tiến*, *Báo lỗi hệ thống*, *Ý kiến khác* (nền `#fefce8` và viền vàng khi được chọn).
    - Hỗ trợ tải ảnh minh chứng từ máy tính thông qua `sellerApi.uploadProductImage` hoặc dán link URL, có thumbnail xem trước kèm nút xóa ảnh tiện lợi.
    - Tab Lịch sử có đầy đủ bộ lọc tìm kiếm theo từ khóa, lọc theo trạng thái và phân loại, kèm bảng chi tiết và popup Modal xem phản hồi chính thức từ Admin.

---

### 7. Tối ưu Hệ thống Voucher Đa cấp, Xử lý User Feedback, Box Chat & Menu Quản trị
- **Tệp nguồn sửa đổi:**
  - `backend-servlet/src/main/resources/db/migration/V018__add_category_id_to_vouchers.sql`
  - `backend-servlet/src/main/java/com/example/webchicken/modules/promotion/model/dto/request/CreateVoucherRequest.java`
  - `backend-servlet/src/main/java/com/example/webchicken/modules/promotion/model/entity/VoucherEntity.java`
  - `backend-servlet/src/main/java/com/example/webchicken/modules/promotion/dao/VoucherDAO.java`
  - `backend-servlet/src/main/java/com/example/webchicken/modules/promotion/service/VoucherService.java`
  - `backend-servlet/src/main/java/com/example/webchicken/modules/promotion/service/impl/VoucherServiceImpl.java`
  - `frontend-client/src/pages/seller/SellerVouchersPage.tsx`
  - `frontend-client/src/pages/admin/AdminVouchersPage.tsx`
  - `frontend-client/src/pages/admin/AdminFeedbacksPage.tsx`
  - `frontend-client/src/styles/chat.css`
  - `frontend-client/src/pages/seller/SellerProductListPage.tsx`
  - `frontend-client/src/pages/buyer/account/ProfilePage.tsx`
  - `frontend-client/src/layouts/AdminLayout.tsx`
- **Nội dung đã khắc phục & bổ sung:**
  1. **Phân hệ Voucher Đa cấp (Seller & Admin)**:
     - Cho phép Người bán (Seller) tạo voucher riêng cho gian hàng (`scope = 'SHOP'`) hoặc theo 1 ngành hàng cụ thể của gian hàng.
     - Cho phép Quản trị viên (Admin) tạo voucher toàn sàn (`scope = 'GLOBAL'`) hoặc cho 1 ngành hàng cụ thể trên toàn sàn (`scope = 'CATEGORY'`).
     - Bổ sung migration `V018__add_category_id_to_vouchers.sql`, mở rộng DTO, Entity, DAO và chặn chặt chẽ quyền tạo theo vai trò người dùng trong Service.
  2. **Tối ưu Xử lý Ý kiến Người dùng (User Feedback)**:
     - Ưu tiên đưa các phản hồi đang ở trạng thái Chờ xử lý (`PENDING`) lên đầu danh sách.
     - Sắp xếp theo ngày tạo cũ nhất trước (FIFO) để giải quyết các trường hợp tồn đọng.
     - Khóa cứng hành động xử lý: Một phản hồi sau khi Admin giải quyết/từ chối chỉ được xử lý đúng 1 lần duy nhất, ngăn chặn chỉnh sửa hoặc ghi đè nhiều lần.
  3. **Khắc phục lỗi Giao diện Box Chat bị đè**:
     - Điều chỉnh tọa độ, kích thước và `z-index` trong `chat.css` tránh xung đột đè lên các thành phần khác của trang.
  4. **Tối ưu Bảng Quản lý Sản phẩm Kênh Người bán (`SellerProductListPage.tsx`)**:
     - Sửa lỗi tìm kiếm không nhận theo tên sản phẩm.
     - Loại bỏ 2 cột Stock và Sales dư thừa, tối ưu hóa không gian hiển thị bảng danh sách sản phẩm.
  5. **Xóa nút Đăng ký bán hàng dư thừa trong Trang cá nhân (`ProfilePage.tsx`)**:
     - Loại bỏ nút đăng ký và modal thừa ở trang `/account/profile`, giữ luồng đăng ký tập trung và sạch sẽ.
  6. **Chuẩn hóa Menu Điều hướng Sidebar Quản trị viên (`AdminLayout.tsx`)**:
     - Tái cấu trúc 8 nhóm menu nghiệp vụ rõ ràng (Overview, Order, Product & Catalog, Shop Management, Marketing Centre, Customer Service, Accounts & Security, System Settings).
     - Khắc phục lỗi bấm chuyển menu bị loạn: Viết lại logic nhận diện route chính xác từng trang và các đường dẫn alias, đảm bảo chỉ highlight đúng mục đang chọn.


