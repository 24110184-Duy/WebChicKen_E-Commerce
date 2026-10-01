# CODE_PRINCIPLES — Bộ luật code bất biến

> Áp dụng cho **mọi** thành viên và **mọi** AI tham gia dự án. Mỗi quy tắc có mã (ví dụ `NAM-03`) để trích dẫn khi review.
> Từ khóa: **PHẢI** = bắt buộc · **KHÔNG ĐƯỢC** = cấm · **NÊN** = mặc định, chỉ lệch khi có lý do ghi trong PR.
> Cấu trúc thư mục và vai trò từng thư mục xem `README.md`. Quyết định kiến trúc xem `docs/ARCHITECTURE.md`.

---

## 1. QUY ƯỚC ĐẶT TÊN (Naming Conventions)

### 1.1 Nguyên tắc chung
- **NAM-01** — Tên phải **nói lên ý nghĩa nghiệp vụ**, không viết tắt khó hiểu. Tránh `data`, `info`, `temp`, `obj`, `mgr`.
- **NAM-02** — Dùng **tiếng Anh** cho mọi định danh trong code, DB và API. Chỉ nội dung hiển thị cho người dùng mới là tiếng Việt (qua i18n).
- **NAM-03** — Một khái niệm = một từ trong toàn hệ thống (ví dụ luôn `order`, không lẫn `purchase`/`booking`).
- **NAM-04** — Từ viết tắt chỉ chấp nhận loại phổ biến (`Id`, `Url`, `Sku`, `Spu`, `Dto`, `Vo`) và viết như một từ (`SkuId`, không `SKUID`).

### 1.2 Java (Backend)

| Đối tượng | Quy tắc | Ví dụ đúng | Ví dụ sai |
|---|---|---|---|
| Package | chữ thường, không gạch dưới; gốc `com.acme.shop` | `com.acme.shop.modules.order.service` | `Com.Acme.Order_Service` |
| Class | `PascalCase`, danh từ | `OrderServiceImpl` | `orderService`, `DoOrder` |
| Interface | `PascalCase`, danh từ/khả năng; **không** tiền tố `I` | `PaymentGateway`, `OrderService` | `IOrderService` |
| Cài đặt interface | Interface + hậu tố `Impl` | `OrderServiceImpl` | `OrderServiceImplementation` |
| DAO | `<Tài nguyên>DAO`, kế thừa `BaseDAO` | `UserDAO`, `ProductDAO`, `OrderDAO` | `UserRepo`, `UserDaoImpl` |
| Servlet | `<Tài nguyên>Servlet` | `ProductServlet` | `ProductController` (dự án dùng "Servlet") |
| Entity / DTO / VO | `<X>Entity`, `<Hành động><X>Request`, `<X>Response`, VO là danh từ miền | `SkuEntity`, `CreateSkuRequest`, `Money` | `SkuModel`, `SkuData` |
| Mapper / Validator | `<X>Mapper`, `<X>RequestValidator` | `OrderMapper` | `OrderConverter` |
| Exception | `<Nguyên-nhân>Exception` | `InsufficientStockException` | `MyException` |
| Event | `<Sự kiện ở quá khứ>Event` | `OrderPaidEvent` | `PayOrderEvent` |
| Method | `camelCase`, **động từ**; truy vấn: `find…` (có thể rỗng), `get…` (bắt buộc có, nếu không → ném), `exists…`, `count…`; ghi: `create…`, `update…`, `delete…`, `place…`, `cancel…` | `findBySlug`, `getById`, `existsByEmail` | `Product1()`, `selectProd` |
| Method trả boolean | tiền tố `is`/`has`/`can` | `isCancellable()` | `cancellable()` |
| Biến / tham số | `camelCase`, danh từ; danh sách số nhiều | `orderItems`, `skuId` | `lst`, `x1` |
| Hằng số | `UPPER_SNAKE_CASE`, `static final` | `MAX_PAGE_SIZE` | `maxPageSize` |
| Enum | Kiểu `PascalCase`, giá trị `UPPER_SNAKE_CASE` | `OrderStatus.CONFIRMED`, `PaymentStatus.UNPAID`, `LoyaltyTier.GOLD` | `OrderStatus.Paid` |
| Tham số kiểu generic | Một chữ in hoa có nghĩa | `T` (entity), `ID` (khóa) | `Type1` |
| Test | `<LớpĐượcTest>Test`; tên phương thức mô tả hành vi | `OrderServiceImplTest` | `Test1` |

### 1.3 Frontend (React / TypeScript / Tailwind)

| Đối tượng | Quy tắc | Ví dụ |
|---|---|---|
| Component | `PascalCase`, file trùng tên component, một component chính mỗi file | `ProductCard.tsx` |
| Hook | `use` + `PascalCase` | `useProductSearch.ts` |
| Hàm / biến | `camelCase`; boolean bắt đầu `is/has/can/should` | `isLoading`, `hasDiscount` |
| Hằng số | `UPPER_SNAKE_CASE` | `MAX_QUANTITY` |
| Type / Interface | `PascalCase`, **không** tiền tố `I`; props là `<Component>Props` | `ProductCardProps` |
| Thư mục | `kebab-case` cho thư mục chung, `lowercase` cho tên feature (một từ) | `features/checkout` |
| File thường | `camelCase.ts` (hàm) — nhất quán trong từng thư mục | `formatMoney.ts` |
| File test | `<tên>.test.ts(x)` cạnh file nguồn | `Price.test.tsx` |
| Route path | `kebab-case`, định nghĩa ở `paths.ts` | `/forgot-password` |
| Khóa i18n | `khu.vực.hành-động` dạng chấm | `cart.empty.title` |
| Query key | mảng `['tài-nguyên', tham-số]` tạo từ `queryKeys` | `queryKeys.products.list(filters)` |
| Design token (CSS variable) | `--<nhóm>-<tên>` ngữ nghĩa, **không** theo giá trị | `--color-price`, `--space-4`, `--radius-card` |
| Lớp tiện ích Tailwind | Dùng token đã khai báo; **KHÔNG ĐƯỢC** dùng giá trị tùy ý (`w-[237px]`, `text-[#ee4d2d]`) trừ khi ghi chú lý do | `bg-primary`, `gap-4` |

- **NAM-05** — Token đặt tên theo **vai trò** (`color-danger`), không theo giá trị (`color-red-1`).
- **NAM-06** — Khoảng cách/cỡ chữ/bo góc chỉ lấy từ thang bội số 4 (xem token).
- **NAM-07** — `Buyer` trong code Java được gọi là `Customer` (đồng nhất với class diagram). Không trộn lẫn `Buyer`/`Customer` trong cùng một module.

### 1.4 MySQL

| Đối tượng | Quy tắc | Ví dụ |
|---|---|---|
| Bảng | `snake_case`, **danh từ số nhiều** | `orders`, `product_variants`, `order_items` |
| Bảng liên kết N–N | `<bảng_a>_<bảng_b>` (số ít ghép) theo thứ tự chữ cái | `user_roles` |
| Cột | `snake_case`, số ít, không lặp tên bảng | `unit_price_minor` |
| **Khóa chính** | luôn tên `id` | `orders.id` |
| **Khóa ngoại** | `<tên_bảng_số_ít>_id` | `order_items.order_id`, `product_variants.product_id` |
| Mã nghiệp vụ | hậu tố `_code` | `orders.order_code` |
| Boolean | tiền tố `is_`/`has_` | `is_default`, `is_active` |
| Thời gian | hậu tố `_at`, kiểu thời gian UTC | `created_at`, `paid_at`, `banned_at` |
| Tiền | hậu tố `_minor` (đơn vị nhỏ nhất) + cột `currency` | `base_price_minor`, `total_amount_minor` |
| Cột chuẩn mọi bảng nghiệp vụ | `id`, `created_at`, `updated_at`; thêm `deleted_at` (xóa mềm) và `version` (khóa lạc quan) khi cần | — |
| Chỉ mục thường | `idx_<bảng>_<cột>` | `idx_orders_customer_id` |
| Ràng buộc duy nhất | `uk_<bảng>_<cột>` | `uk_users_email` |
| Ràng buộc khóa ngoại | `fk_<bảng>_<bảng_tham_chiếu>` | `fk_order_items_orders` |
| Migration | `V<số>__<mô_tả_snake_case>.sql`; **chỉ thêm, không sửa** | `V002__create_stores.sql` |

- **NAM-07** — Mọi cột `status` ánh xạ sang **enum Java** có danh sách giá trị cố định, ghi trong `data-dictionary.md`.
- **NAM-08** — Tên endpoint: danh từ số nhiều, kebab-case (xem `ARCHITECTURE.md` mục 3.1).

---

## 2. QUẢN LÝ TÀI NGUYÊN & VÒNG ĐỜI KẾT NỐI (Resource Lifecycle)

### 2.1 Quy tắc đóng tài nguyên
- **RES-01** — `Connection`, `PreparedStatement`, `ResultSet` **PHẢI** được mở bằng **`try-with-resources`**. **KHÔNG ĐƯỢC** đóng thủ công bằng `finally` và **KHÔNG ĐƯỢC** để tài nguyên thoát ra khỏi phương thức đã mở nó.
- **RES-02** — `ResultSet` **KHÔNG ĐƯỢC** trả ra ngoài Repository. Repository đọc xong → ánh xạ sang Entity/VO → trả về.
- **RES-03** — Ngoài giao dịch: mỗi thao tác Repository mượn một kết nối từ pool và **trả ngay** khi xong.
- **RES-04** — Trong giao dịch: **chỉ `TransactionManager`** mở/commit/rollback và đóng kết nối. Repository lấy kết nối từ `ConnectionContext` và **không** tự đóng nó.
- **RES-05** — Giữ giao dịch **càng ngắn càng tốt**: **KHÔNG ĐƯỢC** gọi HTTP bên ngoài (cổng thanh toán, hãng vận chuyển), gửi mail hay xử lý nặng khi đang giữ kết nối/giao dịch.
- **RES-06** — Mọi thread pool/executor do ứng dụng tạo **PHẢI** có tên, có giới hạn kích thước, và được dừng trong `contextDestroyed`.
- **RES-07** — Luồng tệp (upload/download) đóng bằng `try-with-resources`; giới hạn kích thước ở tầng đọc request.

### 2.2 Cấu hình HikariCP (giá trị khởi điểm — tinh chỉnh bằng thử tải)

| Tham số | Giá trị khởi điểm | Ghi chú |
|---|---|---|
| `maximumPoolSize` | 10–20 mỗi node | Theo công thức tham khảo `(số lõi DB × 2) + số đĩa hiệu dụng`; **nhỏ hơn nhiều so với `maxThreads` của Tomcat** là bình thường. Tổng `maximumPoolSize` của mọi node **phải** nhỏ hơn `max_connections` của MySQL (chừa dư cho công cụ quản trị/migration) |
| `minimumIdle` | Bằng `maximumPoolSize` (pool kích thước cố định) hoặc thấp hơn nếu tải lên xuống thất thường | |
| `connectionTimeout` | 3 000–5 000 ms | Chờ lâu hơn là **thất bại nhanh** (fail-fast) để không dồn thread |
| `idleTimeout` | 600 000 ms | Chỉ có tác dụng khi `minimumIdle` < `maximumPoolSize` |
| `maxLifetime` | 1 800 000 ms | **Phải ngắn hơn** `wait_timeout` của MySQL ít nhất vài chục giây |
| `keepaliveTime` | 300 000 ms | Giữ sống kết nối rảnh qua tường lửa/proxy |
| `validationTimeout` | 2 000–3 000 ms | Dùng kiểm tra kết nối theo chuẩn JDBC4; **không** đặt câu lệnh test thủ công |
| `leakDetectionThreshold` | 20 000 ms ở dev/staging; bật có chủ đích ở prod | Cảnh báo kết nối giữ quá lâu → dấu hiệu rò rỉ |
| `autoCommit` | `true` mặc định; `TransactionManager` tắt tạm trong giao dịch và **khôi phục** khi trả kết nối | |
| `poolName` | Có tên rõ ràng | Để phân biệt trong log/giám sát |
| Thuộc tính MySQL driver | Bật cache câu lệnh chuẩn bị (`cachePrepStmts`, `prepStmtCacheSize` ≈ 250, `prepStmtCacheSqlLimit` ≈ 2048), `connectTimeout` và `socketTimeout` hữu hạn, `characterEncoding=UTF-8`, múi giờ UTC | Giá trị cụ thể phải được đo lại khi thử tải |

- **RES-08** — Pool chỉ tạo **một lần** ở `AppBootstrapListener`, đóng ở `contextDestroyed`. Cấu hình pool **PHẢI** đọc từ config, không hard-code.
- **RES-09** — Phải có **cảnh báo giám sát** khi: số kết nối đang dùng ≥ 80% pool; thời gian chờ lấy kết nối tăng; có cảnh báo leak.
- **RES-10** — Mọi truy vấn **PHẢI** có timeout (query timeout) hữu hạn; truy vấn báo cáo nặng không chạy trên pool giao dịch chính.

---

## 3. CHIẾN LƯỢC BẮT & XỬ LÝ NGOẠI LỆ (Exception Handling)

### 3.1 Phân cấp exception (đặt ở `common/exception`)

| Lớp | Loại | HTTP | Khi nào ném |
|---|---|---|---|
| `AppException` | Cha của mọi lỗi ứng dụng, chứa `ErrorCode` | — | Không ném trực tiếp |
| `ValidationException` | Nghiệp vụ | 422 | Dữ liệu vi phạm quy tắc; mang danh sách lỗi theo trường |
| `BusinessException` | Nghiệp vụ | 409 / 422 (theo `ErrorCode`) | Vi phạm quy tắc nghiệp vụ chung |
| `NotFoundException` | Nghiệp vụ | 404 | Không có tài nguyên (hoặc ẩn tài nguyên của người khác) |
| `ConflictException` | Nghiệp vụ | 409 | Trùng dữ liệu, sai `version`, sai trạng thái |
| `AuthenticationException` | Bảo mật | 401 | Token thiếu/sai/hết hạn |
| `AuthorizationException` | Bảo mật | 403 | Thiếu quyền / không sở hữu |
| `DataAccessException` | Hạ tầng (unchecked) | 500 | Bọc `SQLException`; chứa ngữ cảnh an toàn |
| `ExternalServiceException` | Hạ tầng | 502/503 | Cổng thanh toán, hãng vận chuyển lỗi |

### 3.2 Luật theo tầng
- **EXC-01 — Repository/DAO KHÔNG ĐƯỢC nuốt lỗi.** `catch` rỗng, `printStackTrace`, trả `null`/giá trị mặc định khi lỗi đều **cấm**. Bọc `SQLException` thành `DataAccessException` (giữ `cause`) rồi ném. Vi phạm ràng buộc duy nhất có thể dịch thành `ConflictException`.
- **EXC-02 — Service bọc/ném lỗi nghiệp vụ** bằng exception tùy biến kèm `ErrorCode`. Service **KHÔNG** biết HTTP status; nó chỉ nêu *chuyện gì đã sai*.
- **EXC-03 — Controller/`BaseApiServlet` và `GlobalExceptionFilter` là nơi DUY NHẤT** chuyển exception thành JSON lỗi thống nhất (`ApiError`) và chọn HTTP status theo `ErrorCode`.
- **EXC-04 — Log một lần tại biên.** Quy tắc "**log HOẶC ném, không cả hai**": tầng giữa không vừa log vừa ném lại. Lỗi nghiệp vụ dự kiến log mức `INFO/WARN`; lỗi hạ tầng/không lường trước log mức `ERROR` kèm `requestId` và stack trace (chỉ trong log, **không** trong response).
- **EXC-05 — Không dùng exception để điều khiển luồng** thông thường (ví dụ dùng exception thay `if`).
- **EXC-06 — Không bắt `Exception`/`Throwable` rộng** ngoài các biên (`GlobalExceptionFilter`, job định kỳ, listener). Bắt cụ thể và có xử lý thực sự.
- **EXC-07 — Rollback**: khi exception thoát khỏi phạm vi giao dịch, `TransactionManager` **PHẢI** rollback rồi ném lại nguyên exception.
- **EXC-08 — Job nền / listener / event handler** không được để exception làm chết luồng lập lịch: bắt ở biên job, ghi log `ERROR`, tiếp tục chu kỳ sau.
- **EXC-09 — Thông điệp lỗi trả ra ngoài** lấy từ i18n theo `ErrorCode`; **KHÔNG** chứa SQL, tên bảng, đường dẫn, tên class, dữ liệu cá nhân người khác.
- **EXC-10 — Frontend** phân nhánh theo `error.code`, không theo `message`. Có `ErrorBoundary` cho lỗi render và xử lý riêng 401 (refresh), 403, 404, 409, 422, 429, 5xx.

### 3.3 Sơ đồ ánh xạ
```
SQLException ─► DataAccessException ─┐
Quy tắc nghiệp vụ vi phạm ─► BusinessException/ValidationException/ConflictException ─┤
Thiếu quyền ─► AuthorizationException ─┤
                                       ▼
        BaseApiServlet / GlobalExceptionFilter ─► ErrorCode → HTTP status ─► ApiError JSON
```

---

## 4. QUY TẮC BẢO MẬT & TỐI ƯU HIỆU NĂNG

### 4.1 Chống Injection & XSS
- **SEC-01 — SQL Injection: 100% `PreparedStatement` với tham số.** **KHÔNG ĐƯỢC** nối chuỗi giá trị từ client vào câu lệnh.
- **SEC-02 — Phần động không bind được** (tên cột `ORDER BY`, hướng sắp xếp, tên bảng) **PHẢI** đi qua **danh sách trắng** ánh xạ từ giá trị client sang thành phần SQL do ta định nghĩa; không bao giờ đưa chuỗi client vào SQL.
- **SEC-03 — `LIKE`/tìm kiếm**: thoát ký tự đặc biệt của người dùng; giới hạn độ dài từ khóa.
- **SEC-04 — XSS**: API trả JSON đúng `Content-Type`; nội dung do người dùng nhập có HTML (mô tả sản phẩm, review) **PHẢI** được làm sạch bằng bộ lọc **danh sách trắng thẻ** ở server trước khi lưu. Frontend **KHÔNG ĐƯỢC** dùng `dangerouslySetInnerHTML` trừ khi nội dung đã qua làm sạch và có ghi chú trong PR.
- **SEC-05 — Header an toàn**: `X-Content-Type-Options`, `Strict-Transport-Security` (HTTPS), `Cache-Control: no-store` cho dữ liệu cá nhân, CSP chặt cho SPA ở Nginx.

### 4.2 Xác thực, phân quyền, CSRF
- **SEC-06 — Mật khẩu**: băm bằng thuật toán chuyên dụng chậm (Argon2id hoặc BCrypt cost ≥ 12) kèm salt; **KHÔNG BAO GIỜ** log hay trả mật khẩu/băm.
- **SEC-07 — Token**: access token JWT ngắn hạn (~15 phút) giữ **trong bộ nhớ** FE; refresh token là **cookie `HttpOnly; Secure; SameSite`**, **xoay vòng** mỗi lần dùng, phát hiện dùng lại (reuse) thì thu hồi cả họ token. Khóa ký đọc từ cấu hình bí mật.
- **SEC-08 — CSRF**: endpoint dùng cookie (refresh, đăng xuất) **PHẢI** có chống CSRF (SameSite + kiểm tra header tùy biến/`Origin`). Endpoint dùng `Authorization` header không dính CSRF cổ điển.
- **SEC-09 — Phân quyền hai tầng**: Filter kiểm vai trò theo đường dẫn; **Service kiểm quyền sở hữu** (buyer chỉ chạm đơn của mình; seller chỉ chạm tài nguyên của shop mình) để chống **IDOR**. Mặc định **từ chối**.
- **SEC-10 — Chống dò tài khoản**: thông báo đăng nhập/quên mật khẩu không tiết lộ email có tồn tại; khóa tạm sau nhiều lần sai; giới hạn tần suất.
- **SEC-11 — CORS**: danh sách origin trắng, không `*` khi có credentials (xem `ARCHITECTURE.md` 1.7).
- **SEC-12 — Giá trị do server quyết định**: giá, tổng tiền, phí ship, chiết khấu, trạng thái, `shopId`, `userId` **KHÔNG ĐƯỢC** lấy từ body client; chỉ lấy từ DB/token.

### 4.3 Dữ liệu nhạy cảm & thanh toán
- **SEC-13 — Bí mật** chỉ qua biến môi trường/kho bí mật; **KHÔNG** commit, **KHÔNG** log.
- **SEC-14 — Webhook**: luôn xác minh chữ ký, kiểm tra chống phát lại, xử lý idempotent; **KHÔNG** tin tham số trên URL trả về của trình duyệt.
- **SEC-15 — Không lưu số thẻ/CVV**; chỉ lưu token do cổng thanh toán cấp.
- **SEC-16 — Upload**: kiểm tra loại tệp theo **nội dung** (không chỉ đuôi), giới hạn dung lượng, đổi tên ngẫu nhiên, lưu **ngoài** thư mục web, quét mã độc nếu có; trả URL chứ không trả đường dẫn máy chủ.
- **SEC-17 — Log**: che (mask) email/SĐT/địa chỉ/token; không log body request thô của endpoint nhạy cảm.
- **SEC-18 — Phụ thuộc**: quét lỗ hổng thư viện (BE và FE) trong CI; không dùng bản đã công bố lỗ hổng nghiêm trọng.
- **SEC-19 — Kiểm toán**: thao tác nhạy cảm của Admin (khóa user, duyệt shop, hoàn tiền, can thiệp đơn, đổi cấu hình) ghi `audit_logs`: ai, khi nào, đối tượng, giá trị trước/sau.

### 4.4 Hiệu năng Backend
- **PERF-01 — Phân trang bắt buộc** cho mọi danh sách: mặc định `size = 20`, **tối đa 100**, chặn `page` quá sâu; danh sách rất lớn/cuộn vô hạn dùng **phân trang theo con trỏ (keyset)**.
- **PERF-02 — Tránh N+1**: lấy dữ liệu liên quan bằng truy vấn gộp theo lô (theo danh sách id, có trần kích thước lô), **KHÔNG** truy vấn trong vòng lặp.
- **PERF-03 — Chỉ chọn cột cần thiết** cho màn danh sách; không kéo cột lớn (mô tả dài) khi không cần.
- **PERF-04 — Chỉ mục**: mọi truy vấn lọc/sắp xếp phổ biến phải có chỉ mục phù hợp; kiểm tra bằng kế hoạch thực thi trước khi merge truy vấn mới trên bảng lớn.
- **PERF-05 — Cache**: dữ liệu đọc nhiều, ít đổi (cây danh mục, thương hiệu, cấu hình) cache trong bộ nhớ có TTL và cơ chế vô hiệu hóa khi ghi; kèm `ETag`/`Cache-Control` cho endpoint công khai.
- **PERF-06 — Tính toán nặng/báo cáo/rating tổng hợp** làm **bất đồng bộ** hoặc theo lịch, không tính lúc đọc.
- **PERF-07 — Giới hạn kích thước**: body request, số phần tử mảng, độ dài chuỗi, số tệp đính kèm.
- **PERF-08 — Cạnh tranh**: thao tác giữ kho/voucher/số dư dùng cập nhật có điều kiện hoặc khóa bản ghi + `version`; **KHÔNG** kiểm-rồi-ghi tách rời.
- **PERF-09 — Nén & HTTP**: bật nén JSON; tránh phản hồi vượt mức cần thiết.

### 4.5 Hiệu năng Frontend
- **FE-PERF-01** — **Lazy load theo route** (`React.lazy`) và tách bundle theo khu vực buyer / seller / admin.
- **FE-PERF-02** — Ảnh: `loading="lazy"`, khai báo kích thước/tỉ lệ (`aspect-square`...) để chống nhảy layout; dùng định dạng hiện đại và nhiều kích cỡ.
- **FE-PERF-03** — Danh sách dài dùng **ảo hóa** hoặc phân trang; không render hàng nghìn phần tử.
- **FE-PERF-04** — Ô tìm kiếm **debounce**; hủy request cũ khi gõ tiếp.
- **FE-PERF-05** — Dữ liệu server qua TanStack Query với `staleTime` hợp lý; không trùng request; dùng `invalidate` có chọn lọc thay vì tải lại tất cả.
- **FE-PERF-06** — Không `useEffect` để đồng bộ dữ liệu có thể suy ra; không lưu bản sao dữ liệu server trong store.
- **FE-PERF-07** — Chỉ memo hóa khi đo được lợi ích; không tối ưu sớm.
- **FE-PERF-08** — Mọi màn hình có **skeleton khi tải**, **empty state**, **error state**.

---

## 5. TIÊU CHUẨN TÁI SỬ DỤNG (Reusability Rules)

### 5.1 Nguyên tắc chung
- **REU-01** — Trước khi viết mới, **tìm** thành phần có sẵn trong `common/`, `infrastructure/`, `web/`, `components/`, `shared/`. Tạo mới khi và chỉ khi không có.
- **REU-02** — **Quy tắc ba**: lặp lần thứ ba mới trừu tượng hóa; không trừu tượng hóa dự phòng.
- **REU-03** — Lớp nền (base) **nhỏ và ổn định**; không nhồi mọi thứ vào lớp cha. Ưu tiên **kết hợp (composition)** hơn kế thừa sâu (tối đa 1–2 cấp).
- **REU-04** — Thành phần dùng chung **KHÔNG ĐƯỢC** phụ thuộc vào module/feature cụ thể (phụ thuộc đi từ riêng → chung).

### 5.2 Backend

| Thành phần | Vị trí | Trách nhiệm | Không được |
|---|---|---|---|
| **BaseDAO** | `infrastructure/persistence` | Cung cấp khung thực thi: lấy kết nối từ `DataSource`, cung cấp `getConnection()`, hỗ trợ quản lý `PreparedStatement`, đóng tài nguyên (`try-with-resources`), dịch `SQLException` sang `DataAccessException` | Biết bảng/cột cụ thể; chứa nghiệp vụ |
| **Generic Service** | `common/` hoặc module | Chỉ cho CRUD **thuần**, không có quy tắc nghiệp vụ (ví dụ danh mục tra cứu). Nghiệp vụ thật (Order, Payment, Inventory) viết Service riêng | Dùng Generic Service cho aggregate có quy tắc phức tạp |
| **Common Controller** → `BaseApiServlet` | `web/base` | Template cố định: đọc request → xác thực principal → gọi handler → bọc `ApiResponse` → xử lý exception; hỗ trợ `PathRouter` | Chứa logic của một module |
| `ResponseWriter`, `RequestBodyReader` | `web/base` | Một cách duy nhất để đọc/ghi JSON, UTF-8, giới hạn kích thước | — |
| `PageRequest` / `PageResult` | `common/model` | Mô hình phân trang chung cho mọi module | — |
| `Money` (VO) | `common/model` | Số tiền + tiền tệ; phép cộng/trừ/nhân an toàn; quy tắc làm tròn và phân bổ phần dư | Dùng số thực dấu phẩy động |
| `ErrorCode`, hệ exception | `common/exception` | Nguồn duy nhất cho mã lỗi và ánh xạ HTTP | — |
| Gateway/Policy interface | `modules/*/gateway`, `policy` | Điểm mở rộng (Open/Closed): thêm cài đặt, không sửa chỗ dùng | — |

- **REU-05** — Mapper, Validator, DAO của module nằm **trong** module; chỉ những gì thật sự dùng ≥ 2 module mới được kéo lên `common/`.

### 5.3 Frontend — UI Component nguyên tử

| Component | Yêu cầu tái sử dụng |
|---|---|
| **Button** | Biến thể `variant` (primary/secondary/ghost/danger), `size`, trạng thái `loading`/`disabled`, hỗ trợ icon; mọi trạng thái hover/focus/active/disabled đủ |
| **Input / Select / Checkbox / Radio** | Điều khiển được (controlled), hiển thị lỗi và gợi ý, tích hợp `FormField`, hỗ trợ `aria-*` |
| **Modal / Drawer** | Bẫy focus, đóng bằng `Esc`, khóa cuộn nền, chặn đóng khi đang gửi; nội dung truyền qua `children` |
| **Dropdown** | Điều hướng bàn phím, đóng khi click ngoài, vị trí tự động |
| **DataTable** | Cột cấu hình được, sắp xếp, phân trang, chọn dòng, trạng thái loading/empty/error, cuộn ngang an toàn |
| **Price / Rating / Badge** | Định dạng thống nhất qua `formatMoney`; xử lý giá khoảng, giá gốc gạch ngang, % giảm |
| **Skeleton / EmptyState / ErrorState** | Dùng thống nhất cho mọi danh sách và trang |

- **REU-06** — Component dùng chung: **chỉ nhận dữ liệu qua props**, không gọi API, không đọc store, không biết nghiệp vụ.
- **REU-07** — Style chỉ dùng **token** từ `tokens.css`; biến thể bằng props, không sao chép component để đổi màu.
- **REU-08** — Mỗi component dùng chung có **test** và (nếu có Storybook) **story** cho các trạng thái: mặc định, loading, rỗng, lỗi, dữ liệu cực đoan (tên 150 ký tự, giá 9 chữ số).
- **REU-09** — Hook dùng chung (`useDebounce`, `useUrlState`, `useMediaQuery`) nằm ở `shared/hooks`; hook gắn nghiệp vụ nằm ở `features/<f>/hooks`.

---

## 6. CHẤT LƯỢNG, KIỂM THỬ & QUY TRÌNH

### 6.1 Kiểm thử
- **QA-01** — Mỗi quy tắc nghiệp vụ trong Service có **test đơn vị** (dùng Repository giả); State machine đơn hàng test đủ cả chuyển hợp lệ lẫn bị từ chối.
- **QA-02** — Repository có **integration test** chạy trên MySQL tạm (Testcontainers), không dùng DB dùng chung.
- **QA-03** — Mỗi endpoint: test thành công + lỗi 401/403/404/409/422 đặc thù.
- **QA-04** — Bắt buộc có test **đồng thời** cho giữ kho và dùng voucher (không oversell, không dùng quá lượt).
- **QA-05** — Frontend: test component dùng chung và hook; e2e cho luồng *tìm → xem → thêm giỏ → checkout → thanh toán*.

### 6.2 Log & quan sát
- **OBS-01** — Mọi dòng log có `requestId`; định dạng thống nhất; mức log đúng (`ERROR` chỉ cho lỗi cần người xử lý).
- **OBS-02** — Có health liveness/readiness; đo thời gian xử lý, tỉ lệ lỗi theo endpoint, trạng thái pool.

### 6.3 Git & Review
- **GIT-01** — Nhánh: `main` (luôn triển khai được), `feature/<mã>-<mô-tả>`, `fix/<mã>-<mô-tả>`; không commit thẳng `main`.
- **GIT-02** — Commit theo quy ước `<loại>(<module>): <mô tả>` (ví dụ `feat(order): thêm hủy đơn`).
- **GIT-03** — PR nhỏ, một mục đích, kèm test và cập nhật tài liệu; ít nhất một người duyệt.
- **GIT-04** — CI chặn merge nếu: build/test đỏ, lint lỗi, phát hiện bí mật, quét lỗ hổng mức nghiêm trọng.

### 6.4 Checklist review nhanh
- [ ] Đúng thư mục và đúng layer? Có gọi chéo layer/module sai luật?
- [ ] `try-with-resources` đầy đủ? Có SQL nối chuỗi?
- [ ] Có nuốt lỗi / log trùng / lộ stack trace?
- [ ] Có kiểm quyền sở hữu ở Service? Có tin dữ liệu client cho giá/trạng thái?
- [ ] Có phân trang + trần kích thước? Có N+1?
- [ ] DTO thay vì Entity ở API? Mã trạng thái đúng?
- [ ] FE: có loading/empty/error? Có dùng token thay vì giá trị cứng?
- [ ] Đã cập nhật `api-catalog.md`, `error-codes.md`, migration, test?

---

## 7. DANH SÁCH ANTI-PATTERN BỊ CẤM

| Anti-pattern | Thay bằng |
|---|---|
| **Logic nghiệp vụ trong Entity** (Customer.checkout, Admin.banUser, Seller.addProduct) | Đưa xuống Service (OrderService, AdminService, CatalogService) |
| Logic nghiệp vụ trong Servlet / Filter / trang React | Đưa xuống Service / feature hook |
| Servlet gọi thẳng Repository | Gọi qua Service |
| Trả Entity ra JSON | DTO Response + Mapper |
| `catch (Exception e) {}` hoặc chỉ `printStackTrace` | Bọc & ném exception đúng loại, log một lần ở biên |
| Singleton tĩnh giữ `Connection` | Mượn từ pool theo từng thao tác |
| Dùng `double`/`float` cho tiền | `long` (đơn vị nhỏ nhất) + cột `currency`; hoặc VO `Money` |
| Kiểm tra-rồi-ghi tách rời cho tồn kho/voucher | Cập nhật có điều kiện nguyên tử |
| Tin giá/tổng tiền từ client | Server tính lại từ DB |
| `Utils` khổng lồ chứa mọi thứ | Tách theo trách nhiệm, đặt đúng gói |
| Copy-paste component để đổi style | Biến thể bằng props + token |
| Lưu token trong `localStorage` | Access token trong bộ nhớ, refresh token trong cookie HttpOnly |
| Hard-code URL, chuỗi hiển thị, mã màu | `paths.ts`, i18n, `tokens.css` |
| Sửa migration đã chạy | Thêm migration mới |
| Tạo thư mục mới tùy ý | Theo `README.md`; cần thì xin ADR |
| `UserSession` là HttpSession | `UserSession` là entity lưu refresh token trong DB; **không** sử dụng `javax`/`jakarta` session |

---

*Mọi thay đổi bộ luật này phải qua PR có ít nhất hai người duyệt và ghi lại bằng ADR.*
