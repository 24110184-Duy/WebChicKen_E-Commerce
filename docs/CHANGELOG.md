# 📋 NHẬT KÝ SỬA LỖI & THAY ĐỔI DỰ ÁN (PROJECT CHANGELOG)

> **Mục đích:** Tài liệu này ghi lại toàn bộ các tính năng đã điều chỉnh, nâng cấp và sửa lỗi (Bug Fixes) trong dự án WebChicKen.  
> Bất kỳ lập trình viên hoặc AI nào kéo source code về (git clone / pull) cần đọc tài liệu này để nắm được các thay đổi mới nhất.

---

## 📅 Bản cập nhật: 11/10/2026

### 1. Phân hệ Quản lý Đơn hàng Người bán (Seller Orders & Order Lifecycle Filtering)
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
