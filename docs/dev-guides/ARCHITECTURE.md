# ARCHITECTURE — Hệ thống E-Commerce quy mô lớn (mô hình Amazon / Shopee)

> Tài liệu này là **đặc tả kiến trúc**, không chứa code thực thi (không Java, không React/Vue, không SQL).
> Gồm 5 phần: (1) Thiết lập Tomcat · (2) Phân rã BA + MVC/SOLID · (3) Đặc tả RESTful API · (4) Màn hình Frontend · (5) Cây thư mục.
> Hai file đi kèm đặt ở root dự án: `README.md` (Context Anchor) và `CODE_PRINCIPLES.md` (bộ luật code).

---

## 0. Các quyết định kiến trúc đã chốt (ADR rút gọn)

| ID | Quyết định | Lý do |
|---|---|---|
| ADR-01 | **Tomcat 10.1.x + Servlet 6.0 (namespace `jakarta.*`) + JDK 17** | Chuyển lên Jakarta EE 10; các import đã được đổi toàn bộ từ `javax.*` sang `jakarta.*`. Bản Tomcat 10.1.x hỗ trợ Servlet 6.0 và tương thích Jakarta EE 10. |
| ADR-02 | Deploy dưới dạng **`ROOT.war`** (context path `/`) | URL API thống nhất `/api/v1/...` ở mọi môi trường, không bị tiền tố `/ten-war/`. |
| ADR-03 | **Monorepo, 2 project độc lập**: `backend-servlet` (Maven, WAR) và `frontend-client` (Vite, SPA) | Headless hoàn toàn; build, test, deploy tách biệt. Không có JSP/server-side rendering. |
| ADR-04 | Backend **package-by-module**, bên trong mỗi module chia **layer MVC** | Module = bounded context (BA), layer = kỷ luật kỹ thuật. Dễ tách service sau này. |
| ADR-05 | **Không dùng framework DI**; tự dựng **Composition Root** trong `ServletContextListener`, tiêm phụ thuộc qua constructor | Giữ đúng stack Servlet thuần nhưng vẫn đạt Dependency Inversion. |
| ADR-06 | **Xác thực stateless**: JWT access token ngắn hạn + refresh token xoay vòng; **không dùng `HttpSession`** | Scale ngang nhiều node Tomcat không cần sticky session. |
| ADR-07 | Tiền tệ lưu bằng **số nguyên đơn vị nhỏ nhất** + mã tiền tệ; không dùng số thực dấu phẩy động | Tránh sai số làm tròn khi chia voucher, hoàn tiền. |
| ADR-08 | **Giữ tồn kho (Inventory Reservation) có TTL** khi tạo đơn | Chống bán vượt tồn (oversell); tự nhả kho khi hết hạn thanh toán. |
| ADR-09 | **1 lần checkout → N đơn hàng, tách theo shop** (gom bằng `order_group`) | Đúng mô hình marketplace: mỗi shop xử lý/giao/hoàn riêng. |
| ADR-10 | Đơn hàng có **mã nghiệp vụ** (`order_code`) không đoán được; ID tăng dần chỉ dùng nội bộ | Tránh lộ quy mô, tránh dò ID (IDOR). |
| ADR-11 | Thay đổi schema bằng **migration có đánh phiên bản** (Flyway), không sửa DB bằng tay | Lịch sử schema truy vết được, đồng nhất dev/staging/prod. |
| ADR-12 | Production đặt **Nginx phía trước**: `/api` → Tomcat, còn lại → static SPA (cùng origin) | Giảm phụ thuộc CORS ở prod, TLS/nén/cache tập trung. CORS filter vẫn bắt buộc cho dev/staging. |

> Số phiên bản trong tài liệu là **mốc khuyến nghị**. Khi khởi tạo dự án phải xác minh bản vá mới nhất và khóa phiên bản trong `pom.xml` / `package.json`.

---

# PHẦN 1 — THIẾT LẬP DỰ ÁN APACHE TOMCAT TRÊN ANTIGRAVITY

## 1.1 Giả định về Antigravity

- Antigravity được hiểu là **IDE / workspace phát triển** (có editor, terminal tích hợp, agent). Nó không thay thế Tomcat: **Tomcat là tiến trình riêng**, chạy bằng terminal (hoặc container) trong môi trường của bạn.
- Mọi lệnh build/deploy bên dưới chạy trong **terminal tích hợp** của workspace.
- Nếu Antigravity của bạn là một nền tảng chạy từ xa có quy ước deploy riêng, chỉ thay "bước copy WAR vào `webapps`" bằng cơ chế tương ứng; phần còn lại giữ nguyên. **Hãy xác nhận điểm này trước khi triển khai staging/prod.**

## 1.2 Yêu cầu môi trường

| Thành phần | Phiên bản khuyến nghị | Ghi chú |
|---|---|---|
| JDK | 17 LTS (Temurin) | 21 LTS chấp nhận được. HikariCP bản mới yêu cầu Java 11+. |
| Maven | 3.9.x | Công cụ build chính (Gradle/Ant không dùng song song). |
| Apache Tomcat | 10.1.x | Servlet 6.0, namespace `jakarta.*`. |
| MySQL | 8.0+ (8.4 LTS được) | Engine InnoDB, charset `utf8mb4`. |
| MySQL Connector/J | dòng 8.x trở lên (`mysql-connector-j`) | Chỉ khai báo trong `pom.xml`. |
| HikariCP | 5.x | Pool kết nối. |
| Jackson | 2.17+ | JSON (serialize/deserialize). |
| Flyway | 10.x (+ module MySQL) | Migration schema. |
| Logging | SLF4J + Logback | Log có `requestId`. |
| Node.js | 20 LTS hoặc 22 LTS | Cho `frontend-client`. |
| Trình quản lý gói FE | pnpm 9+ (hoặc npm 10) | Chọn **một** loại, commit lockfile. |
| Nginx | 1.24+ | Staging/prod. |
| Git | 2.40+ | Quy ước nhánh xem `CODE_PRINCIPLES.md`. |
| Docker (tùy chọn) | bản ổn định mới nhất | Chỉ để chạy MySQL dev cho đồng nhất. |

## 1.3 Khởi tạo Project Structure

**Nguyên tắc:** hai project **độc lập**, giao tiếp **duy nhất** qua REST/JSON.

| Project | Công nghệ | Sản phẩm build | Chạy dev |
|---|---|---|---|
| `backend-servlet/` | Maven, packaging `war` | `target/ROOT.war` | Tomcat cổng 8080 |
| `frontend-client/` | Vite + React + TypeScript + Tailwind CSS | thư mục `dist/` (file tĩnh) | Vite dev server cổng 5173 |

Các bước khởi tạo (theo thứ tự):
1. Tạo thư mục gốc `ecommerce-platform/`, chạy `git init`, thêm `.gitignore`, `.editorconfig`, `.gitattributes`.
2. Đặt `README.md` và `CODE_PRINCIPLES.md` ở root **trước khi viết bất kỳ file nào khác** (AI và người mới đều đọc hai file này đầu tiên).
3. Tạo `backend-servlet/` theo cây ở Phần 5: `pom.xml`, `config/`, `src/main/...`, `src/test/...`.
4. Tạo `frontend-client/` theo cây ở Phần 5.
5. Tạo `infra/` (Nginx, Tomcat template, Docker dev) và `docs/`.
6. Commit đầu tiên chỉ chứa khung rỗng + 2 file Context Anchor.

> **Vue.js tùy module:** mặc định toàn bộ là React. Chỉ khi một khu vực (ví dụ Seller Center) bắt buộc dùng Vue thì tạo **app riêng** (`frontend-seller-vue/`) kèm ADR, **không trộn hai framework trong cùng một app**.

## 1.4 Cấu hình MySQL

| Hạng mục | Quy định |
|---|---|
| Charset / Collation | `utf8mb4` (collation hỗ trợ tiếng Việt, ví dụ `utf8mb4_0900_ai_ci`) cho database, bảng và kết nối |
| Múi giờ | Lưu thời gian ở **UTC**; hiển thị theo múi giờ người dùng ở Frontend |
| SQL mode | Bật chế độ **strict** (không cho phép cắt dữ liệu âm thầm) |
| Tài khoản ứng dụng | Một user riêng cho mỗi môi trường, **chỉ có quyền DML trên schema của app**; quyền DDL chỉ cấp cho tài khoản migration |
| Schema | Tách riêng `dev`, `staging`, `prod`; test dùng DB tạm (Testcontainers) |
| Kết nối | Ép dùng TLS ở staging/prod; đặt timeout kết nối và socket |
| `wait_timeout` | Phải **lớn hơn** `maxLifetime` của HikariCP (xem `CODE_PRINCIPLES.md`, mục 2) |

## 1.5 Cấu hình Apache Tomcat

1. **Tách `CATALINA_HOME` và `CATALINA_BASE`:** HOME chứa bản cài Tomcat nguyên vẹn; BASE chứa `conf/`, `webapps/`, `logs/`, `temp/` của dự án. Nâng cấp Tomcat không đụng cấu hình.
2. **Xóa webapp mặc định** (`docs`, `examples`, `host-manager`, `manager`) ở staging/prod. Dev có thể giữ `manager` nhưng chỉ bind localhost.
3. **Connector HTTP** (`server.xml`): cổng 8080; `URIEncoding=UTF-8`; bật nén cho `application/json`; đặt `maxPostSize` và `maxThreads` theo tải; không phơi cổng 8080 ra Internet (chỉ Nginx truy cập).
4. **Valve:** bật `RemoteIpValve` (đọc `X-Forwarded-For`, `X-Forwarded-Proto` từ Nginx) và `AccessLogValve` (ghi `requestId`, thời gian xử lý); không dùng `ErrorReportValve` hiển thị stack trace (`showReport=false`, `showServerInfo=false`).
5. **Triển khai WAR:** `autoDeploy=false`, `unpackWARs=true` ở prod để deploy có kiểm soát.
6. **`setenv` (file trong `CATALINA_BASE/bin/`):** khai báo tham số JVM — `-Xms/-Xmx`, `-Dfile.encoding=UTF-8`, `-Duser.timezone=UTC`, `-Dapp.profile=<dev|staging|prod>`, `-Dapp.config.dir=<đường dẫn thư mục cấu hình ngoài WAR>`. Mẫu ở `infra/tomcat/setenv.sh.template`.
7. **Cookie:** ứng dụng không dùng session; nếu container tự cấp cookie phiên thì tắt (cấu hình `session-config` ở `web.xml`, cookie `HttpOnly` + `Secure`).

## 1.6 Cấu hình Deployment Descriptor & Annotation

**Chính sách:** dùng **Annotation** để khai báo thành phần; dùng **`web.xml` tối thiểu** cho những gì Annotation không làm được.

| Việc cần khai báo | Dùng | Lý do |
|---|---|---|
| Servlet (controller) | `@WebServlet` | Gần class, dễ tìm |
| Listener (khởi tạo/hủy) | `@WebListener` | Vòng đời ứng dụng |
| **Thứ tự filter** | **`web.xml` (`filter-mapping`)** | Annotation **không bảo đảm thứ tự** thực thi filter — thứ tự là điều kiện sống còn về bảo mật |
| Session config, error-page, mime, welcome | `web.xml` | Cấu hình toàn cục |
| `metadata-complete` | `false` | Để container quét annotation |

**Thứ tự filter bắt buộc** (từ ngoài vào trong):

| # | Filter | Nhiệm vụ |
|---|---|---|
| 1 | `RequestIdFilter` | Sinh/nhận `X-Request-Id`, đưa vào log context |
| 2 | `GlobalExceptionFilter` | Bắt mọi ngoại lệ lọt ra → JSON lỗi thống nhất (xem Phần 3) |
| 3 | `CharacterEncodingFilter` | Ép UTF-8 request/response, `Content-Type: application/json; charset=UTF-8` |
| 4 | `CorsFilter` | Xử lý preflight `OPTIONS` và header CORS **trước** xác thực |
| 5 | `SecurityHeadersFilter` | HSTS, `X-Content-Type-Options`, `Cache-Control` cho API, CSP cơ bản |
| 6 | `RateLimitFilter` | Giới hạn tần suất theo IP / user / endpoint nhạy cảm |
| 7 | `AuthenticationFilter` | Đọc & xác minh JWT, gắn `AuthenticatedPrincipal`; endpoint public được liệt kê tường minh |
| 8 | `CsrfGuardFilter` | Chỉ áp cho endpoint dùng cookie (refresh token) |
| 9 | `AuthorizationFilter` | Kiểm tra vai trò (RBAC) theo bảng quy tắc đường dẫn |

> Kiểm tra quyền sở hữu tài nguyên (buyer chỉ xem đơn của mình, seller chỉ sửa sản phẩm của shop mình) **không** làm ở filter mà ở **Service** (chống IDOR).

## 1.7 Context Path, UTF-8, CORS

- **Context path:** `/` (WAR tên `ROOT`). Mọi API nằm dưới `/api/v1/`.
- **UTF-8:** ép ở 3 lớp: `URIEncoding` của Connector, `CharacterEncodingFilter`, và kết nối MySQL `utf8mb4`. Kiểm thử bằng chuỗi tiếng Việt có dấu đi vòng Frontend → DB → Frontend.
- **Đặc tả CORS filter:**

| Thuộc tính | Giá trị |
|---|---|
| Allowed origins | **Danh sách trắng** đọc từ cấu hình (`cors.allowed-origins`), so khớp chính xác; **cấm `*`** vì có credentials |
| Allowed methods | GET, POST, PUT, PATCH, DELETE, OPTIONS |
| Allowed headers | `Authorization`, `Content-Type`, `Accept-Language`, `Idempotency-Key`, `X-Request-Id` |
| Exposed headers | `X-Request-Id`, `Location`, `ETag`, `Retry-After` |
| Credentials | `true` (cần cho cookie refresh token) |
| Preflight max-age | 3600 giây; trả `204`, không đi qua xác thực |
| Header phụ | Luôn thêm `Vary: Origin` |

## 1.8 Quản lý kết nối MySQL (HikariCP) gắn vào `ServletContextListener`

**Vòng đời do `AppBootstrapListener` điều phối:**

| Giai đoạn | Thứ tự bước |
|---|---|
| **Khởi động** (`contextInitialized`) | 1) Đọc cấu hình (env > file ngoài WAR > mặc định trong WAR) → 2) Tạo `DataSource` HikariCP (qua `DataSourceFactory`) → 3) Chạy migration → 4) Dựng **Composition Root** (repository → service → controller dependencies) → 5) Đăng ký các đối tượng dùng chung vào `ServletContext` → 6) Khởi động job định kỳ (nhả kho hết hạn, hủy đơn quá hạn thanh toán, dọn token) |
| **Tắt** (`contextDestroyed`) | 1) Dừng scheduler, chờ job đang chạy → 2) Đóng `DataSource` → 3) Hủy đăng ký JDBC driver (tránh cảnh báo memory leak của Tomcat) → 4) Dừng mọi thread pool tự tạo |

- `DataSource` **chỉ được tạo một lần** ở listener; không `new` pool ở nơi khác.
- Servlet lấy dependency ở `init()` từ `ServletContext`; **không** tự khởi tạo service/repository.
- Bảng tham số pool (giá trị khởi điểm, chỉnh theo load test) nằm ở `CODE_PRINCIPLES.md` mục 2.

## 1.9 Quản lý cấu hình & bí mật

| Nguồn | Độ ưu tiên | Chứa gì |
|---|---|---|
| Biến môi trường / tham số JVM | Cao nhất | Mật khẩu DB, khóa ký JWT, khóa cổng thanh toán, webhook secret |
| File properties ngoài WAR (`-Dapp.config.dir`) | Giữa | Cấu hình theo môi trường không bí mật |
| `config/application*.properties` trong repo | Thấp nhất | Mặc định an toàn, **không bí mật** |

- **Cấm** commit mật khẩu, khóa, token. Chỉ commit `*.example`.
- Tên khóa cấu hình khai báo tập trung ở `config/ConfigKeys` (không rải chuỗi trong code).

## 1.10 Quy trình Build & Deploy

**Backend (`.war`):**
1. Tại `backend-servlet/`: chạy `mvn -P <profile> clean verify` (chạy cả test) rồi `mvn -P <profile> package`.
2. `pom.xml` đặt `packaging = war`, `finalName = ROOT`, khai báo `jakarta.servlet-api` ở scope `provided` (Tomcat tự cung cấp).
3. Sản phẩm: `backend-servlet/target/ROOT.war`.

**Deploy lên Tomcat (staging/prod):**
1. Rút server khỏi load balancer (hoặc bật trang bảo trì).
2. Dừng Tomcat; **xóa** `webapps/ROOT.war` cũ và thư mục `webapps/ROOT/` đã giải nén; **giữ lại bản WAR cũ** ở thư mục lưu trữ để rollback.
3. Copy `ROOT.war` mới vào `$CATALINA_BASE/webapps/`.
4. Khởi động Tomcat, theo dõi log đến khi listener báo khởi động xong.
5. Gọi `/api/v1/system/health/ready` (kiểm tra cả DB) → OK mới đưa lại vào load balancer.
6. Zero-downtime nâng cao: dùng *parallel deployment* của Tomcat (đặt tên `ROOT##<phiên-bản>.war`).
7. Rollback: dừng Tomcat, đặt lại WAR cũ, khởi động lại.

**Frontend:**
1. Tại `frontend-client/`: cài phụ thuộc theo lockfile, build production.
2. Biến môi trường build (tiền tố `VITE_`): `VITE_API_BASE_URL`, `VITE_APP_ENV`. Prod cùng origin nên để đường dẫn tương đối `/api/v1`.
3. Đưa nội dung `dist/` lên Nginx; cấu hình *fallback* về `index.html` cho route SPA; file có hash đặt cache dài, `index.html` không cache.

**Phát triển cục bộ:**
- Chạy MySQL (Docker dev) → chạy Tomcat với `ROOT.war` (hoặc deploy từ IDE) → chạy Vite dev server cổng 5173.
- Vite **proxy** `/api` sang `http://localhost:8080` để tránh CORS khi dev; CORS filter vẫn phải đúng để kiểm thử trường hợp khác origin.

## 1.11 Checklist nghiệm thu môi trường (smoke test)

- [ ] `GET /api/v1/system/health` trả 200; `.../health/ready` trả 200 khi DB thông.
- [ ] Preflight `OPTIONS` từ origin hợp lệ trả 204 + đúng header CORS; origin lạ **không** được cấp header.
- [ ] Gửi/nhận chuỗi tiếng Việt có dấu qua API và DB không lỗi font.
- [ ] Đóng Tomcat không còn cảnh báo leak thread/driver trong log.
- [ ] Kết nối pool về 0 khi nhàn rỗi quá `idleTimeout`; không rò kết nối sau 1.000 request thử tải.
- [ ] Response lỗi không lộ stack trace, tên class hay SQL.

---

# PHẦN 2 — PHÂN RÃ NGHIỆP VỤ (BA MODULES) & KIẾN TRÚC MVC + SOLID

## 2.1 Bản đồ module và hướng phụ thuộc

```
                      ┌──────────────┐
                      │   identity   │  (Auth, User, RBAC, Address)
                      └──────▲───────┘
        ┌──────────────┬─────┴──────┬───────────────┐
┌───────┴──────┐ ┌─────┴─────┐ ┌────┴─────┐  ┌──────┴──────┐
│     shop     │ │  catalog  │ │  media   │  │  backoffice │ (Admin: báo cáo, cấu hình, audit)
└───────▲──────┘ └─────▲─────┘ └──────────┘  └─────────────┘
        │              │
┌───────┴──────┐ ┌─────┴─────┐   ┌────────────┐
│  inventory   │ │ promotion │   │  shipping  │
└───────▲──────┘ └─────▲─────┘   └──────▲─────┘
        │              │                │
        └──────┬───────┴───────┬────────┘
          ┌────┴─────┐   ┌─────┴────┐
          │   cart   │──►│  order   │◄────────┐ (checkout + order lifecycle)
          └──────────┘   └─────▲────┘         │
                               │         ┌────┴─────┐
                          ┌────┴─────┐   │  review  │
                          │ payment  │   └──────────┘
                          └──────────┘
```

**Luật phụ thuộc giữa module (bất biến):**
1. Module A chỉ gọi module B qua **interface trong `service/`** của B (và dùng DTO/VO công khai của B). **Cấm** chạm `dao` hay `entity` của module khác.
2. **Không có vòng phụ thuộc.** Khi cần chiều ngược (ví dụ `payment` báo cho `order`), dùng **Domain Event** qua `EventBus`.
3. Giao dịch (transaction) xuyên module chỉ được mở bởi **service điều phối** (thường là `order`) thông qua `TransactionManager`.
4. Mọi truy cập dữ liệu dùng chung (cấu hình, mã lỗi, phân trang) nằm ở `common/` và `infrastructure/`, không đặt trong module.

## 2.2 Phân rã nghiệp vụ lõi

| Module | Actor | Aggregate / bảng dữ liệu chính | Quy tắc nghiệp vụ cốt lõi | Sự kiện phát ra |
|---|---|---|---|---|
| **identity** | Customer, Seller, Admin, System | `users` (abstract: userId, email, passwordHash, fullName, phone, logoUrl, status: UserStatus, createdAt), `customers` (tier: LoyaltyTier, loyaltyPoint), `sellers` (taxCode, approvedAt), `admins` (role: AdminRole), `addresses`, `user_sessions` (sessionId, cookieContent, isActive, expiredAt), `account_bans` (banId, description, bannedAt), `policy_violation_types` (typeId, description) | Email duy nhất; mật khẩu băm; `user_sessions` lưu refresh token trong DB (không phải HttpSession); `AccountBan` ghi nhận vi phạm; LoyaltyTier: STANDARD / SILVER / PLATINUM / GOLD; AdminRole: SUPER\_ADMIN / MODERATOR; UserStatus: ACTIVE / LOCKED / BANNED | `UserRegistered`, `UserBanned` |
| **shop** | Seller, Admin | `stores` (storeId, storeName, storeType: StoreOwnerType, createdAt), `seller_applications` (applicationId, shopName, documentUrl, status, rejectionReason, adminResponseId, submittedAt, reviewedAt), `feedback_to_admins` (feedbackId, type, subject, content, imageUrl, sellerResponse, createdAt, resolvedAt) | StoreOwnerType: SELLER / BUYER / ADMIN; Buyer nộp SellerApplication → Admin duyệt → trở thành Seller; một Store thuộc một Seller; FeedbackToAdmin để Seller báo cáo vấn đề lên nền tảng | `StoreApproved`, `StoreRejected` |
| **catalog** | Customer (đọc), Seller (ghi), Admin (danh mục) | `products` (productId, name, description, status: ProductStatus, createdAt), `categories` (categoryId, name, description), `product_images` (imageId, imageUrl), `product_variants` (variantId, attribute, basePrice\_minor, stockQuantity) | ProductStatus: PENDING\_APPROVAL / ACTIVE / INACTIVE / OUT\_OF\_STOCK; mỗi Product có nhiều ProductVariant (biến thể theo thuộc tính như màu sắc, kích cỡ, kèm giá và tồn kho); mỗi Product có nhiều ProductImage; Product thuộc một Category | `ProductPublished`, `ProductDeactivated` |
| **inventory** | Seller, System | `product_variants` (stockQuantity, cập nhật qua inventory service) | Tồn kho quản lý trực tiếp trên ProductVariant.stockQuantity; mọi thay đổi ghi sổ cái biến động; không âm; job định kỳ quét OUT\_OF\_STOCK | `StockDepleted` |
| **cart** | Customer | `carts` (cartId, updatedAt), `cart_items` (cartItemId, productId, quantity) | Giỏ gắn Customer; gom theo Store; giá hiển thị là giá hiện tại của ProductVariant, chốt ở checkout; giới hạn số lượng tối đa mỗi dòng | — |
| **promotion** | Admin, Seller, Customer | `vouchers` (voucherId, code, type: DiscountType, discountValue\_minor, minOrderValue\_minor, maxDiscountAmount\_minor, startDate, endDate, isActive) | DiscountType: PERCENTAGE / AMOUNT; kiểm tra đơn tối thiểu và mức giảm tối đa; thời gian hiệu lực; tính chiết khấu phân bổ về từng dòng hàng | `VoucherRedeemed` |
| **order** | Customer, Seller, Admin | `orders` (orderId, orderDate, status: OrderStatus, totalAmount\_minor, paymentStatus: PaymentStatus), `order_items` (orderItemId, productId, quantity, unitPriceAtPurchase\_minor), `order_cancellations` (cancellationId, cancelAt), `cancellation_responses` (reasonId, reasonText, hasVoucher) | OrderStatus: PENDING / CONFIRMED / SHIPPING / DELIVERED / CANCELLED / RETURNED; giá chốt snapshot khi đặt; OrderCancellation khi huỷ; CancellationResponse xử lý hoàn tiền; job định kỳ tự chuyển CONFIRMED→SHIPPING→DELIVERED | `OrderPlaced`, `OrderConfirmed`, `OrderShipped`, `OrderDelivered`, `OrderCancelled`, `OrderReturned` |
| **payment** | Customer, System | `payments` (paymentId, amount\_minor, status: PaymentStatus, transactionRef, paidAt), `payment_methods` (paymentMethodId, type, provider, maskedDetail, isDefault) | PaymentStatus: UNPAID / PAID / REFUNDED / FAILED; server tự tính số tiền từ Order; không tin amount từ client; webhook idempotent xác minh chữ ký | `PaymentSucceeded`, `PaymentFailed`, `RefundCompleted` |
| **review** | Customer, Seller, Admin | `product_reviews` (reviewId, userId, productId, rating, comment, editedBy, postAt, createdAt) | Chỉ review khi Order ở DELIVERED; rating 1–5 sao; có thể sửa (ghi lại editedBy); Admin kiểm duyệt | `ReviewSubmitted` |
| **media** | Customer, Seller | `media_assets` | Chỉ nhận loại tệp cho phép; kiểm tra bằng nội dung chứ không chỉ đuôi tệp; tên tệp ngẫu nhiên; trả URL | — |
| **backoffice** | Admin | `system_settings`, `audit_logs`, bảng tổng hợp báo cáo | Ghi audit cho thao tác nhạy cảm; báo cáo chỉ đọc; cấu hình có phiên bản | — |

## 2.3 Đặc tả nghiệp vụ trọng yếu

### 2.3.1 Phân quyền RBAC

| Vai trò | Mô tả | Phạm vi |
|---|---|---|
| `CUSTOMER` | Khách mua, mặc định khi đăng ký; có LoyaltyTier (STANDARD/SILVER/PLATINUM/GOLD) và loyaltyPoint | Dữ liệu của chính mình |
| `SELLER` | Chủ Store đã được duyệt qua SellerApplication (kế thừa CUSTOMER) | Dữ liệu của **Store mình** |
| `ADMIN` | Quản trị nền tảng; AdminRole: SUPER\_ADMIN hoặc MODERATOR | Toàn hệ thống, ghi audit |
| `SYSTEM` | Tác nhân nội bộ (job định kỳ, tự đổi trạng thái shipping) | Hành động tự động, không đăng nhập |

| Năng lực | Public | CUSTOMER | SELLER | ADMIN (MODERATOR) | ADMIN (SUPER\_ADMIN) | SYSTEM |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Xem sản phẩm, danh mục, review | ✔ | ✔ | ✔ | ✔ | ✔ | |
| Giỏ hàng, checkout, đơn của tôi | | ✔ | ✔ | | | |
| Nộp SellerApplication | | ✔ | | | | |
| Quản lý sản phẩm/kho/đơn của Store | | | ✔ (Store mình) | | ✔ | |
| Kiểm duyệt review, FeedbackToAdmin | | | | ✔ | ✔ | |
| Duyệt Store, quản lý danh mục | | | | | ✔ | |
| Khóa user, ban user (AccountBan) | | | | | ✔ | |
| Job định kỳ (tự chuyển trạng thái) | | | | | | ✔ |

> Kiểm tra quyền sở hữu tài nguyên (Customer chỉ xấm đơn của mình, Seller chỉ sửa sản phẩm của Store mình) **không** làm ở filter mà ở **Service** (chống IDOR).

### 2.3.2 Mô hình Product / ProductVariant

- **Product** (SPU rút gọn): tên, mô tả, danh mục, trạng thái, ảnh.
- **ProductVariant**: mỗi biến thể (thuộc tính — ví dụ "Màu Đỏ / Size M") khớp một hàng trong `product_variants` với `attribute`, `basePrice_minor`, `stockQuantity`.
- **ProductImage**: ảnh của Product (0..n).
- **Category**: danh mục phân cấp; mỗi Product thuộc đúng một Category.
- ProductStatus: `PENDING_APPROVAL` → `ACTIVE`; hoặc `INACTIVE` (Seller tự ẩn); `OUT_OF_STOCK` (hết tồn toàn bộ variant).
- Giỏ hàng và đơn hàng **tham chiếu ProductVariant** (không tham chiếu Product trực tiếp).
- Giá hiển thị ở danh sách: giá thấp nhất trong các variant đang ACTIVE.

### 2.3.3 Quy tắc Voucher / Coupon / Flash Sale (chiết khấu đa tầng)

| Tầng | Loại | Phạm vi áp | Thứ tự tính |
|---|---|---|---|
| 1 | **Giá Flash Sale / Flash Deal** | Cấp SKU (ghi đè giá bán trong khung giờ, có hạn mức số lượng) | Trước tiên |
| 2 | Giảm giá sản phẩm của shop | Cấp SKU/đơn hàng của shop | Sau tầng 1 |
| 3 | **Voucher shop** | Đơn của một shop | Sau tầng 2 |
| 4 | **Voucher sàn** | Toàn bộ đơn trong checkout | Sau tầng 3 |
| 5 | **Voucher vận chuyển** | Chỉ phí ship | Tính trên phí ship |

Quy tắc chung:
- Điều kiện của voucher: giá trị đơn tối thiểu, mức giảm tối đa, thời gian hiệu lực, tổng lượt dùng, lượt dùng mỗi người, phạm vi (shop / danh mục / SKU), loại trừ SKU đang flash sale (cấu hình được), có cho phép **cộng dồn** hay không.
- Giảm giá cấp đơn phải **phân bổ ngược về từng dòng hàng** theo tỷ lệ để phục vụ hoàn tiền từng phần. Phần dư do làm tròn cộng vào dòng cuối.
- Voucher được **khóa lượt dùng** khi đặt đơn, **hoàn lại** khi đơn bị hủy trước khi giao.
- Mọi kết quả tính toán nằm ở **Service** (server là nguồn sự thật); Frontend chỉ hiển thị kết quả.

### 2.3.4 State Machine đơn hàng

Trạng thái: `PENDING` → `CONFIRMED` → `SHIPPING` → `DELIVERED`; nhánh phụ: `CANCELLED`, `RETURNED`.

| Từ | Đến | Tác nhân | Điều kiện (guard) | Hệ quả |
|---|---|---|---|---|
| (mới) | `PENDING` | Customer (đặt đơn) | Tồn kho đủ; giá khớp snapshot | Giữ kho; khóa lượt voucher; tạo giao dịch UNPAID |
| `PENDING` | `CONFIRMED` | Seller | Shop xác nhận đơn | Bắt đầu đóng gói; Payment vẫn UNPAID (trừ COD) |
| `PENDING` | `CANCELLED` | Customer / System | Customer tự hủy hoặc quá hạn thanh toán | Nhả kho; hoàn lượt voucher; Payment → FAILED |
| `CONFIRMED` | `SHIPPING` | System (job định kỳ) | Hết thời gian xử lý hoặc Seller kích hoạt | Bàn giao vận chuyển; trừ tồn thực tế |
| `CONFIRMED` | `CANCELLED` | Seller / Admin | Không thể xử lý | Nhả kho; hoàn tiền nếu đã PAID |
| `SHIPPING` | `DELIVERED` | System (job định kỳ) | Hết thời gian giao hàng ước tính | Payment → PAID; mở cửa sổ đánh giá |
| `DELIVERED` | `RETURNED` | Customer | Trong thời hạn đổi trả; lý do hợp lệ | Tạo OrderCancellation + CancellationResponse; hoàn tiền (Payment → REFUNDED) |

- Mọi chuyển trạng thái đi qua **một nơi duy nhất** (`OrderStateMachine` trong `policy/`) và ghi lịch sử.
- Chuyển trạng thái không hợp lệ → lỗi **409** với mã nghiệp vụ.
- Mọi chuyển trạng thái phải **idempotent** (gọi lặp không gây hệ quả kép).

### 2.3.5 Giao dịch thanh toán

Trạng thái `payments`: `UNPAID` → `PAID` | `FAILED`; sau `PAID` có thể → `REFUNDED`.

- Server tự tính số tiền cần thanh toán từ Order; **không** nhận số tiền từ client.
- `PaymentStatus.UNPAID`: đơn mới tạo, chưa thanh toán.
- `PaymentStatus.PAID`: xác nhận thanh toán thành công (hoặc COD khi giao DELIVERED).
- `PaymentStatus.FAILED`: thanh toán không thành công hoặc hết hạn.
- `PaymentStatus.REFUNDED`: đã hoàn tiền sau RETURNED.
- Cổng thanh toán nằm sau interface `PaymentGateway`; thêm cổng mới = thêm lớp adapter, không sửa service (Open/Closed).

### 2.3.6 Giữ kho (Inventory Reservation)

| Giai đoạn | Điều gì xảy ra |
|---|---|
| Đặt đơn | Tạo `stock_reservation` trạng thái `ACTIVE` với thời hạn hết hạn; thao tác phải **nguyên tử**, kiểm điều kiện `khả dụng ≥ số lượng` ngay trong cùng thao tác ghi để chống đặt trùng đồng thời |
| Thanh toán thành công | Giữ nguyên, đánh dấu `COMMITTED` (không hết hạn nữa) |
| Giao cho vận chuyển | `CONSUMED`: trừ tồn thực, bỏ phần đang giữ, ghi sổ cái |
| Hủy / hết hạn / thanh toán lỗi | `RELEASED` hoặc `EXPIRED`: trả lại phần khả dụng |
- Job định kỳ (chạy trong `ScheduledJobsListener`) quét các giữ chỗ hết hạn; phải chịu được chạy trùng khi có nhiều node (khóa theo bản ghi, xử lý theo lô).
- Hạn mức Flash Sale dùng bộ đếm riêng, cùng cơ chế giữ/nhả.

### 2.3.7 Review & kiểm duyệt

- Điều kiện review: có `order_item` thuộc đơn `DELIVERED`/`COMPLETED` của chính buyer, chưa có review cho mặt hàng đó.
- Nội dung văn bản được **làm sạch** (sanitize) phía server; giới hạn độ dài, số hình/video, dung lượng.
- Vòng đời: `PENDING` → `PUBLISHED` | `REJECTED`; `PUBLISHED` → `HIDDEN` (do báo cáo vi phạm/Admin).
- Rating tổng hợp của sản phẩm được cập nhật **bất đồng bộ** qua sự kiện, không tính lại khi đọc.

## 2.4 Kiến trúc Layered MVC

### 2.4.1 Trách nhiệm từng tầng

| Tầng | Vị trí | Được làm | Cấm |
|---|---|---|---|
| **Controller** (Servlet) | `modules/*/controller` | Nhận request; đọc path/query/body; **validate sơ bộ** (định dạng, bắt buộc); gọi **một** phương thức Service; trả JSON qua wrapper | Chứa logic nghiệp vụ; gọi DAO; mở transaction; viết SQL |
| **Service** | `modules/*/service` | Mọi quy tắc nghiệp vụ; kiểm quyền sở hữu; điều phối transaction; gọi DAO và Service module khác; phát sự kiện | Dùng `HttpServletRequest/Response`; biết JSON/HTTP; biết lớp JDBC cụ thể |
| **DAO** | `modules/*/dao` | Truy vấn CSDL; ánh xạ hàng ↔ Entity; phân trang; thực thi `PreparedStatement` | Chứa quy tắc nghiệp vụ; nuốt lỗi; mở/đóng transaction |
| **Model** | `modules/*/model` | Entity, DTO, VO | Chứa logic truy cập dữ liệu |

### 2.4.2 Phân định Entity / DTO / VO

| Loại | Mục đích | Đặc điểm | Đặt tên |
|---|---|---|---|
| **Entity** | Phản ánh đúng một bảng | Chỉ dùng trong Service ↔ Repository; **không** trả thẳng ra API | `ProductEntity` |
| **DTO Request** | Dữ liệu client gửi lên | Không chứa trường nhạy cảm do server quyết định (id, owner, trạng thái) | `CreateProductRequest` |
| **DTO Response** | Dữ liệu trả về client | Chỉ chứa trường cần hiển thị; che dữ liệu nhạy cảm | `ProductDetailResponse` |
| **Value Object** | Khái niệm miền bất biến, so sánh theo giá trị | Không có định danh; ví dụ `Money`, `Address`, `Rating`, `DateRange` | `Money` |
| **Mapper** | Chuyển đổi Entity ⇄ DTO | Thuần chức năng, không truy cập DB | `ProductMapper` |

### 2.4.3 Áp dụng 5 nguyên lý SOLID

| Nguyên lý | Cách áp dụng cụ thể trong dự án |
|---|---|
| **S** — Single Responsibility | Servlet chỉ lo HTTP; Service chỉ lo nghiệp vụ; Repository chỉ lo dữ liệu; Mapper chỉ chuyển đổi; mỗi filter một nhiệm vụ; mỗi Validator một request |
| **O** — Open/Closed | Thêm cổng thanh toán / hãng vận chuyển / loại voucher bằng **lớp mới** cài đặt interface (`PaymentGateway`, `CarrierGateway`, `PromotionRule`) mà không sửa code cũ; thêm tầng chiết khấu là thêm rule, không sửa engine |
| **L** — Liskov Substitution | Mọi cài đặt `*Repository` (JDBC, in-memory dùng cho test) thay thế nhau mà Service không đổi hành vi; lớp con của `BaseApiServlet` không được làm yếu hợp đồng của lớp cha |
| **I** — Interface Segregation | Tách interface nhỏ theo vai trò (`ReadRepository`, `WriteRepository`, `PageableRepository`) thay vì một interface "thần thánh"; Service công khai cho module khác chỉ lộ những phương thức module khác cần |
| **D** — Dependency Inversion | Service phụ thuộc **interface** Repository/Gateway; cài đặt cụ thể được tiêm bằng constructor tại **Composition Root** (`CompositionRoot`). Interface do tầng nghiệp vụ sở hữu, adapter hạ tầng phụ thuộc ngược lại vào nó |

### 2.4.4 Quản lý giao dịch & sự kiện

- **`TransactionManager`** (hạ tầng) cung cấp ranh giới transaction cho Service; Repository lấy kết nối từ ngữ cảnh luồng hiện hành (`ConnectionContext`), nhờ đó nhiều Repository dùng chung một transaction mà không truyền `Connection` qua tham số.
- Mức cô lập mặc định: của InnoDB (`REPEATABLE READ`); thao tác cạnh tranh (giữ kho, lượt voucher, số dư) dùng khóa bản ghi hoặc cập nhật có điều kiện và **khóa lạc quan** bằng cột `version`.
- **`EventBus` trong tiến trình:** sự kiện chỉ phát **sau khi transaction commit** để người nghe không đọc dữ liệu chưa chốt. Các tác vụ phụ (gửi email, cập nhật rating tổng hợp) xử lý bất đồng bộ trên thread pool có giới hạn, do hạ tầng quản lý vòng đời.
- Khi cần độ tin cậy cao hơn (không mất sự kiện khi sập node), nâng cấp lên **Outbox pattern** (ADR sau này).

---

# PHẦN 3 — ĐẶC TẢ DANH MỤC RESTFUL API (ENTERPRISE)

## 3.1 Quy ước chung

| Hạng mục | Quy ước |
|---|---|
| Base URL | `/api/v1` (phiên bản trong đường dẫn; thay đổi phá vỡ tương thích → `/api/v2`) |
| Tên tài nguyên | **Danh từ số nhiều, chữ thường, kebab-case**: `/products`, `/order-groups` |
| Phân cấp cha–con | `/products/{productId}/skus/{skuId}`; tối đa **3 cấp** lồng nhau |
| Hành động không phải CRUD | Mô hình hóa thành **danh từ con**: hủy đơn = tạo `cancellations`; đăng nhập = tạo `sessions`. Tránh động từ trong URL |
| Định danh trong URL | `{xxxId}` dạng camelCase; đơn hàng dùng `orderId` là mã nghiệp vụ không đoán được |
| Định dạng | Request/Response `application/json; charset=UTF-8`; trường JSON **camelCase**; thời gian ISO-8601 UTC; tiền tệ là số nguyên đơn vị nhỏ nhất + `currency` |
| Namespace theo vai trò | Buyer: tài nguyên cấp cao nhất (`/orders`, `/carts/current`); Seller: `/shops/{shopId}/...`; Admin: `/admin/...`; Hệ thống: `/payments/webhooks/...` |
| Phân trang | Offset: `page` (bắt đầu 1), `size` (mặc định 20, **tối đa 100**). Cuộn vô hạn: `cursor` + `size`. Server luôn áp trần |
| Sắp xếp | `sort=<trường>,<asc\|desc>` — chỉ chấp nhận trường nằm trong **danh sách trắng** của từng endpoint |
| Lọc | Tham số query riêng từng trường (`categoryId`, `minPrice`, `maxPrice`, `minRating`, `brandId`, `status`...) |
| Header yêu cầu | `Authorization: Bearer <accessToken>`; `Accept-Language` (vi/en); `X-Request-Id` (tùy chọn); `Idempotency-Key` (bắt buộc cho POST tạo đơn/thanh toán/hoàn tiền) |
| Header phản hồi | `X-Request-Id`; `Location` (với 201); `Retry-After` (với 429/503) |
| Cập nhật | `PUT` = thay toàn bộ; `PATCH` = thay một phần; cập nhật cạnh tranh dùng `version`, lệch → 409 |
| Xóa | Mặc định **xóa mềm** (`deleted_at`); trả 204 |

## 3.2 Quy chuẩn HTTP Status Code

| Mã | Dùng khi | Ghi chú |
|---|---|---|
| **200 OK** | Đọc/cập nhật thành công có nội dung trả về | Cả `POST` tính toán không tạo tài nguyên bền vững (báo giá ship) |
| **201 Created** | Tạo tài nguyên mới | Kèm `Location` |
| **204 No Content** | Thành công, không có nội dung (xóa, đăng xuất, đổi mật khẩu) | Không có body |
| **400 Bad Request** | Cú pháp sai: JSON hỏng, sai kiểu dữ liệu, thiếu tham số bắt buộc, sai `Content-Type` | Lỗi **hình thức** |
| **401 Unauthorized** | Chưa xác thực / token thiếu, hết hạn, sai | Kèm mã lỗi phân biệt `hết hạn` và `không hợp lệ` để FE biết khi nào refresh |
| **403 Forbidden** | Đã xác thực nhưng không đủ quyền hoặc không sở hữu tài nguyên | Với tài nguyên người khác, cân nhắc trả 404 để không lộ sự tồn tại |
| **404 Not Found** | Không tìm thấy tài nguyên / đường dẫn | |
| **409 Conflict** | Xung đột trạng thái: trùng dữ liệu duy nhất, sai `version`, chuyển trạng thái đơn không hợp lệ, hết tồn kho khi đặt, giá đã đổi | Lỗi **trạng thái** |
| **422 Unprocessable Entity** | Dữ liệu đúng cú pháp nhưng **vi phạm quy tắc nghiệp vụ/validate**: SĐT sai định dạng, voucher hết hạn, mật khẩu yếu | Lỗi **ngữ nghĩa**, kèm danh sách lỗi theo trường |
| **429 Too Many Requests** | Vượt giới hạn tần suất | Kèm `Retry-After` |
| **500 Internal Server Error** | Lỗi không lường trước | Không lộ chi tiết, chỉ trả `requestId` |
| **503 Service Unavailable** | Quá tải/bảo trì/phụ thuộc ngoài không sẵn sàng | Kèm `Retry-After` |

## 3.3 Cấu trúc khung vỏ (Response Wrapper)

**Phản hồi thành công**

| Trường | Kiểu | Mô tả |
|---|---|---|
| `success` | boolean | Luôn `true` |
| `data` | object / array / null | Dữ liệu chính |
| `meta` | object / null | Siêu dữ liệu: với danh sách có `page`, `size`, `totalElements`, `totalPages`, `hasNext`; với cursor có `nextCursor`; với tìm kiếm có `facets` |
| `requestId` | string | Mã truy vết, trùng header `X-Request-Id` |
| `timestamp` | string | Thời điểm phản hồi, ISO-8601 UTC |

**Phản hồi lỗi**

| Trường | Kiểu | Mô tả |
|---|---|---|
| `success` | boolean | Luôn `false` |
| `error.code` | string | Mã lỗi nghiệp vụ ổn định (xem 3.4) — **FE dựa vào đây**, không dựa vào `message` |
| `error.message` | string | Thông điệp thân thiện, theo `Accept-Language` |
| `error.details` | array | Với 422: mỗi phần tử gồm `field`, `reason`, `rejectedValue` (che giá trị nhạy cảm) |
| `error.docUrl` | string / null | Liên kết tài liệu (tùy chọn) |
| `requestId` | string | Mã truy vết |
| `timestamp` | string | Thời điểm lỗi |
| `path` | string | Đường dẫn gây lỗi |

Quy tắc: **không bao giờ** trả stack trace, tên class, câu SQL hay đường dẫn máy chủ ra ngoài.

## 3.4 Danh mục mã lỗi nghiệp vụ (tiền tố theo module)

Định dạng: `<MODULE>_<NNNN>`.

| Tiền tố | Module | Ví dụ ý nghĩa (đăng ký chi tiết ở `docs/api/error-codes.md`) |
|---|---|---|
| `COMMON_` | Dùng chung | `0001` JSON hỏng, `0002` tham số thiếu, `0003` quá giới hạn tần suất, `0099` lỗi hệ thống |
| `AUTH_` | identity | `0001` token hết hạn, `0002` token không hợp lệ, `0003` sai thông tin đăng nhập, `0004` tài khoản bị khóa, `0005` refresh token bị dùng lại |
| `USER_` | identity | email đã tồn tại, mật khẩu yếu, địa chỉ vượt giới hạn |
| `CAT_` | catalog | danh mục có con không xóa được, tổ hợp SKU trùng, sản phẩm không còn bán |
| `SHOP_` | shop | shop chưa được duyệt, shop bị đình chỉ |
| `INV_` | inventory | không đủ tồn kho, giữ kho hết hạn |
| `CART_` | cart | vượt số lượng tối đa, SKU ngừng bán |
| `PROMO_` | promotion | voucher hết hạn / hết lượt / chưa đạt đơn tối thiểu / không áp dụng được |
| `ORD_` | order | chuyển trạng thái không hợp lệ, giá đã thay đổi, quá hạn đổi trả |
| `PAY_` | payment | chữ ký webhook sai, số tiền không khớp, thanh toán đã xử lý |
| `SHIP_` | shipping | khu vực không hỗ trợ, vận đơn không tồn tại |
| `REV_` | review | đơn chưa giao, đã đánh giá, hết hạn sửa |
| `MEDIA_` | media | loại tệp không cho phép, vượt dung lượng |

## 3.5 Danh mục endpoint

**Chú thích quyền:** `P` Public · `B` Buyer · `S` Seller của shop (kèm kiểm sở hữu `shopId`) · `A` Admin · `SYS` Hệ thống (webhook đã xác thực chữ ký).
Cột "Lỗi" chỉ liệt kê mã **đặc thù**; mọi endpoint đều có thể trả 400/401/403/429/500 theo quy ước chung.

### 3.5.1 Auth

| Method | Endpoint | Mô tả | Quyền | OK | Lỗi đặc thù |
|---|---|---|---|---|---|
| POST | `/auth/registrations` | Đăng ký tài khoản Buyer | P | 201 | 409 trùng email, 422 |
| POST | `/auth/sessions` | Đăng nhập → access token (+ cookie refresh) | P | 201 | 401, 422, 429 |
| DELETE | `/auth/sessions/current` | Đăng xuất, thu hồi refresh token | B/S/A | 204 | — |
| POST | `/auth/tokens/refresh` | Cấp lại access token từ cookie refresh | cookie | 200 | 401 (hết hạn / bị dùng lại) |
| POST | `/auth/password-resets` | Yêu cầu quên mật khẩu (luôn 204 để không lộ email) | P | 204 | 429 |
| PUT | `/auth/password-resets/{token}` | Đặt mật khẩu mới | P | 204 | 400, 422 |
| POST | `/auth/email-verifications` | Gửi lại email xác minh | B | 204 | 429 |
| PUT | `/auth/email-verifications/{token}` | Xác minh email | P | 204 | 400 |

### 3.5.2 Users

| Method | Endpoint | Mô tả | Quyền | OK | Lỗi đặc thù |
|---|---|---|---|---|---|
| GET | `/users/me` | Hồ sơ của tôi | B | 200 | — |
| PATCH | `/users/me` | Cập nhật hồ sơ | B | 200 | 422 |
| PUT | `/users/me/password` | Đổi mật khẩu | B | 204 | 422 |
| GET | `/users/me/addresses` | Danh sách địa chỉ nhận hàng | B | 200 | — |
| POST | `/users/me/addresses` | Thêm địa chỉ | B | 201 | 422, 409 (vượt giới hạn) |
| PUT | `/users/me/addresses/{addressId}` | Sửa địa chỉ | B | 200 | 404, 422 |
| DELETE | `/users/me/addresses/{addressId}` | Xóa địa chỉ | B | 204 | 404 |
| PUT | `/users/me/default-address` | Đặt địa chỉ mặc định | B | 204 | 404 |

### 3.5.3 Shops & Seller onboarding

| Method | Endpoint | Mô tả | Quyền | OK | Lỗi đặc thù |
|---|---|---|---|---|---|
| POST | `/shops` | Nộp đơn đăng ký bán hàng | B | 201 | 409 đã có shop, 422 |
| GET | `/shops/{shopId}` | Trang hồ sơ shop công khai | P | 200 | 404 |
| GET | `/shops/me` | Shop của tôi (Seller) | S | 200 | 404 |
| PATCH | `/shops/{shopId}` | Cập nhật thông tin shop | S | 200 | 403, 422 |
| GET | `/shops/{shopId}/dashboard` | Số liệu tổng quan shop | S | 200 | 403 |
| GET | `/shops/{shopId}/reports/sales` | Báo cáo doanh thu shop (`from`,`to`,`groupBy`) | S | 200 | 422 |

### 3.5.4 Catalog — đọc công khai

| Method | Endpoint | Mô tả | Quyền | OK | Lỗi đặc thù |
|---|---|---|---|---|---|
| GET | `/categories` | Cây danh mục (có thể giới hạn độ sâu) | P | 200 | — |
| GET | `/categories/{categoryId}` | Chi tiết danh mục | P | 200 | 404 |
| GET | `/categories/{categoryId}/attributes` | Thuộc tính dùng làm bộ lọc | P | 200 | 404 |
| GET | `/brands` | Danh sách thương hiệu (lọc theo danh mục) | P | 200 | — |
| GET | `/products` | **Tìm kiếm & liệt kê (PLP)**: `q`, `categoryId`, `brandId`, `shopId`, `minPrice`, `maxPrice`, `minRating`, `freeShipping`, `sort`, `page`/`cursor`, `size`; `meta.facets` trả số lượng theo bộ lọc | P | 200 | 422 tham số lọc sai |
| GET | `/products/{productId}` | Chi tiết sản phẩm (PDP): mô tả, ảnh, biến thể, thuộc tính, shop | P | 200 | 404 |
| GET | `/products/{productId}/skus` | Danh sách SKU kèm giá và **trạng thái tồn** (còn/ít/hết, không lộ số chính xác) | P | 200 | 404 |
| GET | `/products/{productId}/skus/{skuId}` | Chi tiết một SKU | P | 200 | 404 |
| GET | `/products/{productId}/recommendations` | Sản phẩm liên quan | P | 200 | 404 |
| GET | `/search/suggestions` | Gợi ý tìm kiếm (`q`) | P | 200 | — |
| POST | `/media/uploads` | Tải tệp ảnh/video lên | B/S | 201 | 422, `MEDIA_*` |

### 3.5.5 Seller Center — quản lý sản phẩm & kho

| Method | Endpoint | Mô tả | Quyền | OK | Lỗi đặc thù |
|---|---|---|---|---|---|
| GET | `/shops/{shopId}/products` | Danh sách sản phẩm của shop (lọc theo trạng thái) | S | 200 | 403 |
| POST | `/shops/{shopId}/products` | Tạo SPU (nháp) | S | 201 | 422 |
| GET | `/shops/{shopId}/products/{productId}` | Chi tiết để sửa | S | 200 | 404 |
| PUT | `/shops/{shopId}/products/{productId}` | Sửa SPU | S | 200 | 409 version, 422 |
| PUT | `/shops/{shopId}/products/{productId}/publication` | Đăng bán / ẩn / gửi duyệt | S | 200 | 409, 422 |
| DELETE | `/shops/{shopId}/products/{productId}` | Xóa mềm sản phẩm | S | 204 | 409 còn đơn đang xử lý |
| POST | `/shops/{shopId}/products/{productId}/skus` | Tạo SKU | S | 201 | 409 trùng tổ hợp, 422 |
| PATCH | `/shops/{shopId}/products/{productId}/skus/{skuId}` | Sửa giá/mã/trọng lượng SKU | S | 200 | 409, 422 |
| DELETE | `/shops/{shopId}/products/{productId}/skus/{skuId}` | Xóa mềm SKU | S | 204 | 409 |
| GET | `/shops/{shopId}/warehouses` | Danh sách kho | S | 200 | — |
| POST | `/shops/{shopId}/warehouses` | Tạo kho | S | 201 | 422 |
| PUT | `/shops/{shopId}/warehouses/{warehouseId}` | Sửa kho | S | 200 | 404, 422 |
| GET | `/shops/{shopId}/inventory` | Tồn kho theo SKU/kho (`skuId`,`warehouseId`,`lowStock`) | S | 200 | — |
| PUT | `/shops/{shopId}/inventory/{skuId}/warehouses/{warehouseId}` | Đặt số tồn | S | 200 | 409 version, 422 |
| POST | `/shops/{shopId}/inventory/adjustments` | Điều chỉnh tồn (+/−) có lý do | S | 201 | 409 âm kho, 422 |
| GET | `/shops/{shopId}/inventory/movements` | Sổ cái biến động kho | S | 200 | — |

### 3.5.6 Cart

| Method | Endpoint | Mô tả | Quyền | OK | Lỗi đặc thù |
|---|---|---|---|---|---|
| GET | `/carts/current` | Giỏ hàng hiện tại, gom theo shop, kèm cảnh báo (hết hàng, đổi giá) | B | 200 | — |
| POST | `/carts/current/items` | Thêm SKU vào giỏ | B | 201 | 409 hết hàng, 422 vượt số lượng |
| PATCH | `/carts/current/items/{itemId}` | Đổi số lượng / chọn-bỏ chọn | B | 200 | 404, 409, 422 |
| DELETE | `/carts/current/items/{itemId}` | Xóa một dòng | B | 204 | 404 |
| DELETE | `/carts/current/items` | Xóa nhiều dòng / làm trống giỏ | B | 204 | — |
| POST | `/carts/current/merge-requests` | Gộp giỏ khách (gửi từ FE) sau khi đăng nhập | B | 200 | 422 |
| POST | `/carts/current/vouchers` | Áp mã giảm giá để xem trước | B | 200 | 422 `PROMO_*` |
| DELETE | `/carts/current/vouchers/{code}` | Gỡ mã giảm giá | B | 204 | 404 |

### 3.5.7 Promotion (Voucher / Flash Sale)

| Method | Endpoint | Mô tả | Quyền | OK | Lỗi đặc thù |
|---|---|---|---|---|---|
| GET | `/vouchers` | Voucher có thể thu thập (lọc theo shop/loại) | P | 200 | — |
| POST | `/vouchers/{voucherId}/claims` | Thu thập voucher vào ví | B | 201 | 409 đã lấy/hết lượt, 422 |
| GET | `/users/me/vouchers` | Ví voucher của tôi | B | 200 | — |
| GET | `/flash-sales` | Khung giờ đang diễn ra và sắp diễn ra | P | 200 | — |
| GET | `/flash-sales/{flashSaleId}/items` | Sản phẩm trong khung giờ, kèm % đã bán | P | 200 | 404 |
| POST | `/flash-sales/{flashSaleId}/items` | Shop đăng ký SKU tham gia | S | 201 | 409, 422 |
| GET | `/shops/{shopId}/vouchers` | Voucher của shop | S | 200 | — |
| POST | `/shops/{shopId}/vouchers` | Tạo voucher shop | S | 201 | 422 |
| PUT | `/shops/{shopId}/vouchers/{voucherId}` | Sửa voucher (hạn chế khi đã có lượt dùng) | S | 200 | 409, 422 |
| DELETE | `/shops/{shopId}/vouchers/{voucherId}` | Dừng/xóa mềm voucher | S | 204 | — |

### 3.5.8 Checkout & Orders

| Method | Endpoint | Mô tả | Quyền | OK | Lỗi đặc thù |
|---|---|---|---|---|---|
| POST | `/checkouts` | Tạo phiên checkout từ các dòng giỏ đã chọn; chốt báo giá (snapshot giá, ship, giảm giá) | B | 201 | 409 giá/tồn thay đổi, 422 |
| GET | `/checkouts/{checkoutId}` | Xem phiên checkout (địa chỉ, ship từng shop, voucher, tổng tiền) | B | 200 | 404 |
| PATCH | `/checkouts/{checkoutId}` | Đổi địa chỉ / đơn vị vận chuyển / voucher / phương thức thanh toán → tính lại | B | 200 | 422 `PROMO_*`, `SHIP_*` |
| GET | `/checkouts/{checkoutId}/shipping-options` | Lựa chọn vận chuyển cho từng shop | B | 200 | 404 |
| POST | `/checkouts/{checkoutId}/orders` | **Đặt hàng**: sinh `order_group` + N đơn theo shop, giữ kho, khóa voucher. Bắt buộc `Idempotency-Key` | B | 201 | 409 `INV_*`/giá đổi, 422 |
| GET | `/orders` | Đơn của tôi (lọc `status`, `from`, `to`) | B | 200 | — |
| GET | `/orders/{orderId}` | Chi tiết đơn + lịch sử trạng thái | B | 200 | 404 |
| GET | `/orders/{orderId}/shipments` | Vận đơn và dòng thời gian theo dõi | B | 200 | 404 |
| POST | `/orders/{orderId}/cancellations` | Buyer hủy đơn (kèm lý do) | B | 201 | 409 không thể hủy, 422 |
| POST | `/orders/{orderId}/confirmations` | Buyer xác nhận đã nhận hàng | B | 201 | 409 |
| POST | `/orders/{orderId}/returns` | Yêu cầu trả hàng/hoàn tiền | B | 201 | 409 quá hạn, 422 |
| GET | `/shops/{shopId}/orders` | Đơn của shop (lọc trạng thái) | S | 200 | — |
| GET | `/shops/{shopId}/orders/{orderId}` | Chi tiết đơn để xử lý | S | 200 | 404 |
| POST | `/shops/{shopId}/orders/{orderId}/acceptances` | Shop xác nhận đơn (PAID → PROCESSING) | S | 201 | 409 |
| POST | `/shops/{shopId}/orders/{orderId}/rejections` | Shop từ chối/hủy đơn (có lý do) | S | 201 | 409, 422 |
| POST | `/shops/{shopId}/orders/{orderId}/shipments` | Tạo vận đơn, bàn giao (→ SHIPPING) | S | 201 | 409, 422 |
| PUT | `/shops/{shopId}/returns/{returnId}/decision` | Chấp nhận / từ chối trả hàng | S | 200 | 409, 422 |

### 3.5.9 Payment

| Method | Endpoint | Mô tả | Quyền | OK | Lỗi đặc thù |
|---|---|---|---|---|---|
| GET | `/payment-methods` | Phương thức khả dụng (COD, thẻ, ví, chuyển khoản...) | B | 200 | — |
| POST | `/orders/{orderId}/payments` | Khởi tạo thanh toán; trả URL chuyển hướng hoặc mã khách. Bắt buộc `Idempotency-Key` | B | 201 | 409 đã thanh toán, 422 |
| GET | `/orders/{orderId}/payments` | Lịch sử giao dịch của đơn | B | 200 | 404 |
| GET | `/payments/{paymentId}` | Trạng thái một giao dịch | B | 200 | 404 |
| POST | `/payments/webhooks/{provider}` | **Webhook** từ cổng thanh toán; xác minh chữ ký, idempotent | SYS | 200 | 401 chữ ký sai, 422 |
| GET | `/payments/returns/{provider}` | Điểm trả về của trình duyệt sau khi thanh toán (chuyển hướng 302 về FE) | P | 302 | — |

> Mã `302` ở endpoint trả về của trình duyệt là ngoại lệ có chủ đích so với bảng 3.2; kết quả cuối cùng **luôn dựa vào webhook / truy vấn trạng thái**, không tin tham số trên URL trả về.

### 3.5.10 Shipping

| Method | Endpoint | Mô tả | Quyền | OK | Lỗi đặc thù |
|---|---|---|---|---|---|
| GET | `/shipping/carriers` | Đơn vị vận chuyển được hỗ trợ | P | 200 | — |
| POST | `/shipping/quotes` | Báo phí ship theo địa chỉ, trọng lượng, hãng | B | 200 | 422 `SHIP_*` |
| POST | `/shipping/webhooks/{carrier}` | Cập nhật trạng thái từ hãng vận chuyển | SYS | 200 | 401 chữ ký sai |

### 3.5.11 Reviews

| Method | Endpoint | Mô tả | Quyền | OK | Lỗi đặc thù |
|---|---|---|---|---|---|
| GET | `/products/{productId}/reviews` | Review công khai (lọc số sao, có hình/video; sắp xếp) | P | 200 | 404 |
| GET | `/products/{productId}/reviews/summary` | Điểm trung bình và phân bố sao | P | 200 | 404 |
| POST | `/orders/{orderId}/items/{orderItemId}/reviews` | Viết review (kèm media) | B | 201 | 409 đã review/đơn chưa giao, 422 |
| PUT | `/reviews/{reviewId}` | Sửa review trong hạn | B | 200 | 409 hết hạn sửa, 403 |
| DELETE | `/reviews/{reviewId}` | Xóa review của mình | B | 204 | 403 |
| POST | `/reviews/{reviewId}/helpful-votes` | Bình chọn hữu ích | B | 201 | 409 đã bình chọn |
| DELETE | `/reviews/{reviewId}/helpful-votes` | Bỏ bình chọn | B | 204 | — |
| POST | `/reviews/{reviewId}/reports` | Báo cáo review vi phạm | B | 201 | 409 |
| POST | `/shops/{shopId}/reviews/{reviewId}/replies` | Shop phản hồi review | S | 201 | 409 đã phản hồi |

### 3.5.12 Admin Portal (`/admin/...`, quyền `A`, mọi thao tác ghi đều có audit log)

| Method | Endpoint | Mô tả | OK | Lỗi đặc thù |
|---|---|---|---|---|
| GET | `/admin/users` | Danh sách người dùng (tìm, lọc vai trò/trạng thái) | 200 | — |
| GET | `/admin/users/{userId}` | Chi tiết người dùng | 200 | 404 |
| PUT | `/admin/users/{userId}/status` | Khóa / mở khóa | 204 | 409 |
| PUT | `/admin/users/{userId}/roles` | Gán vai trò | 204 | 422 |
| GET | `/admin/shops` | Danh sách shop / đơn đăng ký chờ duyệt | 200 | — |
| PUT | `/admin/shops/{shopId}/approval` | Duyệt / từ chối đơn đăng ký (kèm lý do) | 200 | 409 |
| PUT | `/admin/shops/{shopId}/status` | Đình chỉ / khôi phục shop | 204 | 409 |
| POST | `/admin/categories` | Tạo danh mục | 201 | 409, 422 |
| PUT | `/admin/categories/{categoryId}` | Sửa / di chuyển danh mục | 200 | 409, 422 |
| DELETE | `/admin/categories/{categoryId}` | Xóa mềm danh mục | 204 | 409 còn con/sản phẩm |
| POST | `/admin/brands` | Tạo thương hiệu | 201 | 409 |
| PUT | `/admin/brands/{brandId}` | Sửa thương hiệu | 200 | 422 |
| GET | `/admin/products` | Duyệt sản phẩm (lọc `status=PENDING`) | 200 | — |
| PUT | `/admin/products/{productId}/moderation` | Phê duyệt / từ chối / cấm | 200 | 409 |
| GET | `/admin/orders` | Tất cả đơn hàng | 200 | — |
| GET | `/admin/orders/{orderId}` | Chi tiết đơn | 200 | 404 |
| POST | `/admin/orders/{orderId}/interventions` | Can thiệp đơn (hủy/ép chuyển trạng thái, bắt buộc lý do) | 201 | 409 |
| POST | `/admin/payments/{paymentId}/refunds` | Tạo hoàn tiền (toàn phần/một phần). Bắt buộc `Idempotency-Key` | 201 | 409, 422 |
| GET | `/admin/reviews` | Hàng đợi kiểm duyệt (`status`) | 200 | — |
| PUT | `/admin/reviews/{reviewId}/moderation` | Duyệt / từ chối / ẩn | 200 | 409 |
| POST | `/admin/campaigns` | Tạo chiến dịch khuyến mãi | 201 | 422 |
| POST | `/admin/flash-sales` | Tạo khung giờ Flash Sale | 201 | 409 chồng lịch, 422 |
| PUT | `/admin/flash-sales/{flashSaleId}` | Sửa / dừng khung giờ | 200 | 409 |
| POST | `/admin/vouchers` | Tạo voucher sàn | 201 | 422 |
| GET | `/admin/reports/revenue` | Doanh thu (`from`,`to`,`groupBy`) | 200 | 422 |
| GET | `/admin/reports/top-products` | Sản phẩm bán chạy | 200 | 422 |
| GET | `/admin/reports/orders-summary` | Tổng hợp đơn theo trạng thái | 200 | 422 |
| GET | `/admin/settings` | Danh sách cấu hình hệ thống | 200 | — |
| PUT | `/admin/settings/{key}` | Cập nhật cấu hình | 200 | 409 version, 422 |
| GET | `/admin/audit-logs` | Nhật ký thao tác | 200 | — |

### 3.5.13 System

| Method | Endpoint | Mô tả | Quyền | OK |
|---|---|---|---|---|
| GET | `/system/health` | Liveness (tiến trình còn sống) | P | 200 |
| GET | `/system/health/ready` | Readiness (kiểm tra kết nối DB) | P | 200 / 503 |

## 3.6 Yêu cầu phi chức năng của API

- **Idempotency:** server lưu kết quả theo cặp (người dùng, `Idempotency-Key`) trong thời hạn quy định; gửi lại cùng khóa trả đúng kết quả cũ, khác nội dung → 409.
- **Giới hạn tần suất:** chặt hơn cho `/auth/*`, `/shipping/quotes`, tìm kiếm; trả 429 + `Retry-After`.
- **Cache HTTP:** endpoint đọc công khai (danh mục, thương hiệu) cho phép cache ngắn + `ETag`; endpoint có dữ liệu cá nhân `Cache-Control: no-store`.
- **Tương thích ngược:** thêm trường mới là thay đổi tương thích; xóa/đổi nghĩa trường phải lên phiên bản mới.
- **Tài liệu:** mỗi endpoint mới phải cập nhật `docs/api/api-catalog.md` cùng PR.

---

# PHẦN 4 — PHÂN TÁCH FRONTEND CHO CÁC MÀN HÌNH CHUẨN AMAZON / SHOPEE

## 4.1 Nguyên tắc Frontend

| Hạng mục | Quy định |
|---|---|
| Framework | React + TypeScript + Vite; Tailwind CSS (token khai báo tập trung ở `src/styles/tokens.css`) |
| Điều hướng | React Router; **chia bundle theo khu vực** (buyer / seller / admin) bằng lazy loading theo route |
| Dữ liệu từ server | TanStack Query (cache, retry, invalidate). Khóa truy vấn khai báo ở `shared/api/queryKeys` |
| Trạng thái giao diện | Store nhẹ (Zustand) chỉ cho: người dùng hiện tại, UI toàn cục (drawer, toast), nháp giỏ khách. **Không** copy dữ liệu server vào store |
| Form | React Hook Form + Zod (schema đặt trong `features/<x>/schemas`) |
| Trạng thái lọc/tìm kiếm | Lưu trên **URL query string** để chia sẻ link, nút Back hoạt động, SEO-friendly |
| Token | Access token giữ **trong bộ nhớ**; refresh token là cookie HttpOnly. **Cấm** lưu token vào `localStorage` |
| Lỗi | Dựa vào `error.code` của API; có `ErrorBoundary` cấp route; mọi màn hình có đủ trạng thái **loading (skeleton) / empty / error** |
| Hiệu năng | Lazy route, lazy ảnh (`loading=lazy`, kích thước cố định chống nhảy layout), ảo hóa danh sách dài, debounce ô tìm kiếm |
| Truy cập | Điều hướng bàn phím, `aria-*` cho modal/dropdown, tương phản màu đạt chuẩn, vùng chạm ≥ 44px trên mobile |

## 4.2 Layout dùng chung (`src/layouts`)

| Layout | Dùng cho | Thành phần |
|---|---|---|
| `PublicLayout` | Trang mua sắm | Header (logo, ô tìm kiếm, giỏ mini, tài khoản) + thanh danh mục + Footer + giỏ mini (drawer) |
| `AuthLayout` | Đăng nhập/đăng ký/quên mật khẩu | Khung tối giản căn giữa, không menu |
| `CheckoutLayout` | Checkout, kết quả thanh toán | Header rút gọn (logo + tiến trình), không có thanh danh mục để tránh phân tâm |
| `AccountLayout` | Khu vực tài khoản Buyer | `PublicLayout` + sidebar điều hướng tài khoản |
| `SellerLayout` | Seller Center | Sidebar thu gọn được + Topbar (shop, thông báo) |
| `AdminLayout` | Admin Portal | Sidebar + Topbar + khu vực breadcrumb, bảng dữ liệu rộng |

## 4.3 Public & Buyer Pages

| Route | Trang (`src/pages/...`) | Layout | Vai trò | Nội dung / hành vi chính | API chính |
|---|---|---|---|---|---|
| `/` | `public/HomePage` | Public | P | **Hero Carousel** (tự chạy, dừng khi hover, có nút/chấm điều hướng); **Flash Deals** (đồng hồ đếm ngược, thanh % đã bán); **Category Grid**; **Gợi ý cho bạn** (cuộn vô hạn) | `/categories`, `/flash-sales`, `/products` |
| `/search` · `/c/:categorySlug` | `public/ProductListPage` (PLP) | Public | P | Thanh **bộ lọc (facet)**: khoảng giá, thương hiệu, đánh giá ≥ n sao, miễn phí ship...; **sắp xếp** (liên quan, mới, bán chạy, giá ↑↓); **phân trang** (desktop) hoặc "tải thêm"/cuộn vô hạn (mobile); chip bộ lọc đang áp + "Xóa tất cả"; **trạng thái rỗng** có gợi ý sửa từ khóa; mobile: bộ lọc mở dạng Drawer | `/products`, `/categories/{id}/attributes`, `/brands`, `/search/suggestions` |
| `/p/:slug-i.:productId` | `public/ProductDetailPage` (PDP) | Public | P | **Image Gallery** (thumbnail + zoom); **Variation Selector** (chọn tổ hợp → tìm SKU tương ứng, vô hiệu hóa tổ hợp hết hàng); **Buy Box** (giá, giá gốc, % giảm, trạng thái kho, chọn số lượng, *Thêm vào giỏ*, *Mua ngay*); thông tin shop; **Thông số kỹ thuật**; mô tả; **Reviews** (tóm tắt sao, lọc, ảnh/video); sản phẩm liên quan | `/products/{id}`, `/products/{id}/skus`, `/products/{id}/reviews`, `/products/{id}/reviews/summary`, `/products/{id}/recommendations`, `/carts/current/items` |
| `/shops/:shopId` | `public/ShopPage` | Public | P | Hồ sơ shop, voucher của shop, danh mục trong shop, lưới sản phẩm | `/shops/{id}`, `/products?shopId=`, `/vouchers?shopId=` |
| `/vouchers` | `public/VoucherCenterPage` | Public | P/B | Danh sách voucher, nút *Thu thập* | `/vouchers`, `/vouchers/{id}/claims` |
| `/flash-sales` | `public/FlashSalePage` | Public | P | Các khung giờ, sản phẩm theo khung | `/flash-sales`, `/flash-sales/{id}/items` |
| `/cart` | `buyer/CartPage` | Public | B | Nhóm theo shop; chọn/bỏ chọn; **Quantity Stepper** (cận min/max theo tồn); cảnh báo hết hàng/đổi giá; ô nhập voucher; tóm tắt tiền; nút *Mua hàng* | `/carts/current*` |
| `/checkout` | `buyer/CheckoutPage` | Checkout | B | Các bước: **địa chỉ nhận hàng** → **đơn vị vận chuyển theo shop** → **áp voucher** → **phương thức thanh toán** → xem lại & *Đặt hàng*; tổng tiền tính lại mỗi thay đổi; chống bấm đúp (disable + `Idempotency-Key`); xử lý 409 (đổi giá/hết hàng) bằng hộp thoại xác nhận | `/checkouts*`, `/users/me/addresses`, `/payment-methods` |
| `/checkout/result` | `buyer/PaymentResultPage` | Checkout | B | Hiển thị kết quả dựa trên **trạng thái đơn từ server** (polling ngắn khi đang chờ webhook); nút *Thanh toán lại* | `/orders/{id}`, `/orders/{id}/payments` |
| `/login` · `/register` · `/forgot-password` · `/reset-password/:token` · `/verify-email/:token` | `public/auth/*` | Auth | P | Form có validate, hiển thị lỗi theo `error.code`/`details` | `/auth/*` |
| `/account/profile` | `buyer/account/ProfilePage` | Account | B | Hồ sơ, đổi mật khẩu | `/users/me*` |
| `/account/addresses` | `buyer/account/AddressBookPage` | Account | B | CRUD địa chỉ, đặt mặc định | `/users/me/addresses*` |
| `/account/orders` | `buyer/account/OrderListPage` | Account | B | Tab theo trạng thái (Chờ thanh toán, Đang xử lý, Đang giao, Đã giao, Đã hủy, Trả hàng); phân trang | `/orders` |
| `/account/orders/:orderId` | `buyer/account/OrderDetailPage` | Account | B | **Dòng thời gian theo dõi vận đơn**, danh sách hàng, tiền; nút *Hủy đơn* / *Đã nhận hàng* / *Trả hàng* / *Đánh giá* theo trạng thái | `/orders/{id}*`, `/orders/{id}/shipments` |
| `/account/vouchers` | `buyer/account/MyVouchersPage` | Account | B | Ví voucher | `/users/me/vouchers` |
| `/account/reviews` | `buyer/account/MyReviewsPage` | Account | B | Hàng chờ đánh giá, sửa/xóa review | `/orders/.../reviews`, `/reviews/{id}` |
| `/403` · `/500` · `*` | `errors/*` | Public | P | Trang lỗi; trang 404 gợi ý về trang chủ/tìm kiếm | — |

## 4.4 Seller Center & Super Admin Portal

**Seller (`/seller/*`, yêu cầu vai trò `SELLER`, layout `SellerLayout`):**

| Route | Trang | Nội dung chính | API |
|---|---|---|---|
| `/seller/register` | `seller/SellerRegisterPage` | Form đăng ký shop (bước: thông tin → giấy tờ → xác nhận) | `/shops`, `/media/uploads` |
| `/seller` | `seller/DashboardPage` | Doanh thu, đơn cần xử lý, sản phẩm sắp hết hàng, biểu đồ | `/shops/{id}/dashboard` |
| `/seller/products` | `seller/ProductListPage` | Bảng sản phẩm, lọc trạng thái, thao tác hàng loạt | `/shops/{id}/products` |
| `/seller/products/new` · `/seller/products/:id/edit` | `seller/ProductEditorPage` | Trình soạn nhiều bước: thông tin cơ bản → thuộc tính → **nhóm biến thể & ma trận SKU** (giá, mã, tồn từng ô) → ảnh/video → vận chuyển → gửi duyệt; lưu nháp tự động | `/shops/{id}/products*`, `.../skus*`, `/media/uploads` |
| `/seller/inventory` | `seller/InventoryPage` | Tồn theo SKU/kho, chỉnh nhanh, lịch sử biến động | `/shops/{id}/inventory*`, `/warehouses*` |
| `/seller/orders` · `/seller/orders/:id` | `seller/OrderListPage` · `OrderDetailPage` | Xử lý đơn: xác nhận → tạo vận đơn → in phiếu; xử lý yêu cầu trả hàng | `/shops/{id}/orders*` |
| `/seller/promotions` | `seller/PromotionPage` | Tạo/sửa voucher shop, đăng ký Flash Sale | `/shops/{id}/vouchers*`, `/flash-sales/{id}/items` |
| `/seller/reviews` | `seller/ReviewPage` | Xem và phản hồi review | `/shops/{id}/reviews/{id}/replies` |
| `/seller/reports` | `seller/ReportPage` | Báo cáo doanh thu | `/shops/{id}/reports/sales` |
| `/seller/settings` | `seller/ShopSettingsPage` | Hồ sơ, kho, vận chuyển | `/shops/{id}` |

**Admin (`/admin/*`, yêu cầu vai trò `ADMIN`, layout `AdminLayout`):**

| Route | Trang | Nội dung chính | API |
|---|---|---|---|
| `/admin` | `admin/DashboardPage` | KPI toàn sàn | `/admin/reports/*` |
| `/admin/shops` | `admin/ShopApprovalPage` | Hàng đợi duyệt shop, đình chỉ | `/admin/shops*` |
| `/admin/users` | `admin/UserManagementPage` | Tìm, khóa, gán vai trò | `/admin/users*` |
| `/admin/categories` · `/admin/brands` | `admin/CategoryTreePage` · `BrandPage` | Quản lý cây danh mục (kéo-thả), thương hiệu | `/admin/categories*`, `/admin/brands*` |
| `/admin/products` | `admin/ProductModerationPage` | Duyệt sản phẩm | `/admin/products*` |
| `/admin/orders` | `admin/OrderMonitorPage` | Giám sát đơn, can thiệp, hoàn tiền | `/admin/orders*`, `/admin/payments/.../refunds` |
| `/admin/reviews` | `admin/ReviewModerationPage` | Kiểm duyệt review | `/admin/reviews*` |
| `/admin/campaigns` | `admin/CampaignPage` | Chiến dịch, Flash Sale, voucher sàn | `/admin/campaigns`, `/admin/flash-sales*`, `/admin/vouchers` |
| `/admin/reports` | `admin/ReportPage` | Doanh thu, top sản phẩm, tổng hợp đơn | `/admin/reports/*` |
| `/admin/settings` · `/admin/audit-logs` | `admin/SettingsPage` · `AuditLogPage` | Cấu hình hệ thống, nhật ký thao tác | `/admin/settings*`, `/admin/audit-logs` |

## 4.5 Bộ Component dùng chung (Atomic Design)

| Cấp | Thư mục | Ví dụ |
|---|---|---|
| Atoms | `components/atoms` | `Button`, `IconButton`, `Input`, `Select`, `Checkbox`, `Radio`, `Badge`, `Price`, `Rating`, `Avatar`, `Spinner`, `Skeleton`, `Icon` |
| Molecules | `components/molecules` | `SearchBox`, `QuantityStepper`, `RatingSummary`, `FilterItem`, `FormField`, `Dropdown`, `Tabs`, `Breadcrumb`, `Toast`, `CountdownTimer` |
| Organisms | `components/organisms` | `Modal`, `Drawer`, `DataTable`, `Pagination`, `ProductCard`, `ImageGallery`, `Carousel`, `VariationSelector`, `FilterPanel`, `AddressForm`, `MiniCart` |
| Feedback | `components/feedback` | `EmptyState`, `ErrorState`, `ErrorBoundary`, `ConfirmDialog` |

Quy tắc: component dùng chung **không biết** API hay nghiệp vụ (nhận dữ liệu qua props); component gắn nghiệp vụ nằm trong `features/<x>/components`.

## 4.6 Bảo vệ route

| Guard | Hành vi |
|---|---|
| `GuestOnly` | Đã đăng nhập → chuyển khỏi trang đăng nhập/đăng ký |
| `RequireAuth` | Chưa đăng nhập → chuyển `/login` kèm đường dẫn quay lại; thử refresh token trước khi chuyển |
| `RequireRole` | Thiếu vai trò → `/403` |
| Lưu ý | Guard ở FE chỉ để **trải nghiệm**; bảo mật thật nằm ở Backend |

---

# PHẦN 5 — CÂY CẤU TRÚC THƯ MỤC HỆ THỐNG TOÀN DIỆN

> Quy ước: thư mục kết thúc bằng `/`; file có mô tả sau dấu `#`. Phần `<module>` lặp lại theo **Module Template**; chỉ các module tiêu biểu được khai triển, còn lại **bắt buộc đúng template**.

## 5.1 Root

```
ecommerce-platform/
├── README.md                          # CONTEXT ANCHOR — đọc đầu tiên (bắt buộc cho người và AI)
├── CODE_PRINCIPLES.md                 # Bộ luật code bất biến
├── .gitignore
├── .gitattributes
├── .editorconfig                      # UTF-8, LF, indent thống nhất
├── docs/
│   ├── ARCHITECTURE.md                # Tài liệu này
│   ├── api/
│   │   ├── api-catalog.md             # Danh mục endpoint (cập nhật cùng PR)
│   │   └── error-codes.md             # Sổ đăng ký mã lỗi nghiệp vụ
│   ├── adr/                           # Architecture Decision Records: ADR-0001-*.md ...
│   ├── ba/
│   │   ├── module-specs/              # Đặc tả nghiệp vụ từng module
│   │   ├── user-stories/              # User Story + Acceptance Criteria (Given/When/Then)
│   │   └── state-machines/            # Sơ đồ trạng thái đơn hàng, thanh toán, kho
│   └── db/
│       ├── erd/                       # Sơ đồ quan hệ thực thể
│       └── data-dictionary.md         # Từ điển dữ liệu (bảng, cột, ý nghĩa)
├── infra/
│   ├── nginx/
│   │   └── site.conf.template         # /api → Tomcat, còn lại → SPA (fallback index.html)
│   ├── tomcat/
│   │   ├── setenv.sh.template         # Tham số JVM, -Dapp.profile, -Dapp.config.dir
│   │   └── server.xml.notes.md        # Ghi chú cấu hình Connector/Valve đã chỉnh
│   ├── mysql/
│   │   └── my.cnf.example             # utf8mb4, múi giờ, strict mode
│   ├── docker/
│   │   └── docker-compose.dev.yml     # MySQL dev
│   └── scripts/                       # Script build/deploy/rollback (shell)
├── backend-servlet/                   # → 5.2
└── frontend-client/                   # → 5.3
```

## 5.2 Backend — `backend-servlet/`

```
backend-servlet/
├── pom.xml                            # packaging=war, finalName=ROOT, profiles dev/staging/prod
├── config/
│   ├── application.properties         # Mặc định an toàn, KHÔNG bí mật
│   ├── application-dev.properties
│   ├── application-staging.properties
│   └── application-prod.properties.example   # Mẫu; file thật nằm ngoài repo
└── src/
    ├── main/
    │   ├── java/com/acme/shop/
    │   │   ├── bootstrap/                         # Khởi động/tắt ứng dụng
    │   │   │   ├── AppBootstrapListener           # @WebListener: config → DataSource → migration → CompositionRoot
    │   │   │   ├── CompositionRoot                # Nơi DUY NHẤT khởi tạo & nối dependency
    │   │   │   └── ScheduledJobsListener          # Job định kỳ (nhả kho hết hạn, hủy đơn quá hạn...)
    │   │   │
    │   │   ├── config/                            # Đọc & mô hình hóa cấu hình
    │   │   │   ├── ConfigLoader
    │   │   │   ├── ConfigKeys                     # Hằng số tên khóa cấu hình
    │   │   │   ├── AppConfig
    │   │   │   ├── DataSourceFactory              # Dựng HikariCP
    │   │   │   ├── CorsSettings
    │   │   │   ├── JwtSettings
    │   │   │   └── StorageSettings
    │   │   │
    │   │   ├── web/                               # Hạ tầng tầng Web dùng chung
    │   │   │   ├── base/
    │   │   │   │   ├── BaseApiServlet             # Khung xử lý chung: parse → authorize → delegate → respond
    │   │   │   │   ├── PathRouter                 # Định tuyến /{id}/sub-resource trong 1 servlet
    │   │   │   │   ├── RequestContext             # Principal, locale, requestId của request hiện tại
    │   │   │   │   ├── RequestBodyReader          # Đọc & giới hạn kích thước body JSON
    │   │   │   │   └── ResponseWriter             # Ghi ApiResponse/ApiError ra HTTP
    │   │   │   ├── filter/                        # Thứ tự khai báo ở web.xml
    │   │   │   │   ├── RequestIdFilter
    │   │   │   │   ├── GlobalExceptionFilter
    │   │   │   │   ├── CharacterEncodingFilter
    │   │   │   │   ├── CorsFilter
    │   │   │   │   ├── SecurityHeadersFilter
    │   │   │   │   ├── RateLimitFilter
    │   │   │   │   ├── AuthenticationFilter
    │   │   │   │   ├── CsrfGuardFilter
    │   │   │   │   └── AuthorizationFilter
    │   │   │   ├── security/
    │   │   │   │   ├── AuthenticatedPrincipal
    │   │   │   │   └── AccessRules                # Bảng đường dẫn → vai trò
    │   │   │   └── support/
    │   │   │       ├── PaginationParams           # Parse & chặn trần page/size
    │   │   │       ├── SortParams                 # Parse & kiểm danh sách trắng trường sắp xếp
    │   │   │       └── LocaleResolver
    │   │   │
    │   │   ├── common/                            # Shared kernel — không phụ thuộc module nào
    │   │   │   ├── constant/                      # ApiPaths, HeaderNames
    │   │   │   ├── enums/                         # RoleName, SortDirection...
    │   │   │   ├── exception/                     # AppException, BusinessException, ValidationException,
    │   │   │   │                                  # NotFoundException, ConflictException, AuthenticationException,
    │   │   │   │                                  # AuthorizationException, DataAccessException, ErrorCode
    │   │   │   ├── model/                         # ApiResponse, ApiError, PageRequest, PageResult, Money (VO)
    │   │   │   ├── validation/                    # Tiện ích & quy tắc validate dùng chung
    │   │   │   └── util/                          # JsonMapper, DateTimeUtils, SlugUtils, IdGenerator
    │   │   │
    │   │   ├── infrastructure/                    # Triển khai kỹ thuật; KHÔNG chứa nghiệp vụ
    │   │   │   ├── persistence/
    │   │   │   │   ├── BaseDAO                    # Lớp cơ sở cung cấp kết nối DataSource, PreparedStatement, đóng tài nguyên
    │   │   │   │   ├── TransactionManager         # Ranh giới transaction cho Service
    │   │   │   │   ├── ConnectionContext          # Kết nối gắn với luồng hiện hành
    │   │   │   │   ├── RowMapper
    │   │   │   │   └── StatementBinder
    │   │   │   ├── security/                      # JwtTokenService, PasswordHasher
    │   │   │   ├── event/                         # DomainEvent, EventBus, InMemoryEventBus
    │   │   │   ├── cache/                         # CacheService, InMemoryCache
    │   │   │   ├── scheduling/                    # JobScheduler
    │   │   │   ├── mail/                          # MailSender (+ adapter)
    │   │   │   ├── storage/                       # Adapter cài đặt FileStorage (cục bộ / object storage)
    │   │   │   ├── payment/                       # Adapter cài đặt PaymentGateway theo từng cổng
    │   │   │   └── shipping/                      # Adapter cài đặt CarrierGateway theo từng hãng
    │   │   │
    │   │   └── modules/                           # ★ Mỗi thư mục con = 1 bounded context
    │   │       ├── identity/                      # (Module Template, xem 5.2.1)
    │   │       ├── catalog/                       # (Khai triển mẫu, xem 5.2.2)
    │   │       ├── shop/
    │   │       ├── inventory/
    │   │       ├── cart/
    │   │       ├── promotion/
    │   │       ├── order/                         # (Khai triển mẫu, xem 5.2.3)
    │   │       ├── payment/
    │   │       ├── shipping/
    │   │       ├── review/
    │   │       ├── media/
    │   │       └── backoffice/
    │   │
    │   ├── resources/
    │   │   ├── db/migration/                      # V<phiên-bản>__<mô-tả>.sql (Flyway) — CHỈ thêm mới, không sửa file cũ
    │   │   ├── i18n/
    │   │   │   ├── messages_vi.properties
    │   │   │   └── messages_en.properties
    │   │   └── logback.xml
    │   └── webapp/
    │       └── WEB-INF/
    │           └── web.xml                        # Thứ tự filter, session-config, error-page (tối thiểu)
    └── test/
        ├── java/com/acme/shop/                    # Phản chiếu cấu trúc main; test đơn vị Service dùng DAO giả
        │   └── it/                                # Integration test (MySQL tạm bằng Testcontainers)
        └── resources/
```

### 5.2.1 Module Template (mọi module BẮT BUỘC theo mẫu này)

```
modules/<module>/
├── controller/                 # *Servlet — @WebServlet("/api/v1/<tài-nguyên>/*"), kế thừa BaseApiServlet
├── service/
│   ├── <Aggregate>Service      # INTERFACE — hợp đồng nghiệp vụ, module khác chỉ được gọi qua đây
│   └── impl/
│       └── <Aggregate>ServiceImpl
├── dao/
│   └── <Aggregate>DAO          # Lớp DAO kế thừa BaseDAO, viết trực tiếp các hàm truy vấn JDBC (PreparedStatement)
├── model/
│   ├── entity/                 # *Entity — khớp bảng CSDL
│   ├── dto/
│   │   ├── request/            # *Request
│   │   └── response/           # *Response
│   └── vo/                     # Value Object bất biến
├── mapper/                     # *Mapper — Entity ⇄ DTO
├── validator/                  # *RequestValidator — validate chi tiết
├── exception/                  # Ngoại lệ đặc thù, kế thừa BusinessException
├── event/                      # Domain event do module phát ra
├── policy/                     # (tùy chọn) Rule/State machine/Engine đặc thù
└── gateway/                    # (tùy chọn) Interface cổng ra bên ngoài (payment, shipping)
```

### 5.2.2 Ví dụ khai triển: `modules/catalog/`

```
modules/catalog/
├── controller/
│   ├── CategoryServlet            # /api/v1/categories/*
│   ├── BrandServlet               # /api/v1/brands/*
│   ├── ProductServlet             # /api/v1/products/*            (đọc công khai)
│   ├── SellerProductServlet       # /api/v1/shops/{shopId}/products/*
│   ├── SearchSuggestionServlet    # /api/v1/search/suggestions
│   └── AdminCatalogServlet        # /api/v1/admin/categories|brands|products/*
├── service/
│   ├── CategoryService  ProductService  SkuService  BrandService  ProductSearchService
│   └── impl/  (…ServiceImpl tương ứng)
├── repository/
│   ├── CategoryRepository  ProductRepository  SkuRepository  BrandRepository
│   └── jdbc/  (Jdbc…Repository tương ứng)
├── model/
│   ├── entity/  CategoryEntity  BrandEntity  ProductEntity  SkuEntity  VariationOptionEntity  ProductMediaEntity
│   ├── dto/request/   CreateProductRequest  UpdateProductRequest  CreateSkuRequest  ProductSearchRequest
│   ├── dto/response/  ProductSummaryResponse  ProductDetailResponse  SkuResponse  CategoryNodeResponse  FacetResponse
│   └── vo/            SkuOptionCombination  PriceRange  ProductStatus
├── mapper/            ProductMapper  SkuMapper  CategoryMapper
├── validator/         CreateProductRequestValidator  CreateSkuRequestValidator
├── exception/         DuplicateSkuCombinationException  CategoryNotEmptyException
└── event/             ProductPublishedEvent  ProductHiddenEvent
```

### 5.2.3 Ví dụ khai triển: `modules/order/`

```
modules/order/
├── controller/
│   ├── CheckoutServlet            # /api/v1/checkouts/*
│   ├── OrderServlet               # /api/v1/orders/*
│   ├── SellerOrderServlet         # /api/v1/shops/{shopId}/orders/*
│   └── AdminOrderServlet          # /api/v1/admin/orders/*
├── service/
│   ├── CheckoutService  OrderService  OrderFulfillmentService  ReturnService
│   └── impl/
├── repository/
│   ├── CheckoutRepository  OrderRepository  OrderStatusHistoryRepository  ReturnRequestRepository
│   └── jdbc/
├── model/
│   ├── entity/  CheckoutEntity  OrderGroupEntity  OrderEntity  OrderItemEntity  OrderStatusHistoryEntity
│   ├── dto/request/   CreateCheckoutRequest  UpdateCheckoutRequest  PlaceOrderRequest  CancelOrderRequest
│   ├── dto/response/  CheckoutResponse  OrderSummaryResponse  OrderDetailResponse
│   └── vo/            OrderStatus  OrderCode  PriceBreakdown  ShippingAddressSnapshot
├── mapper/
├── validator/
├── exception/         InvalidOrderTransitionException  PriceChangedException
├── event/             OrderPlacedEvent  OrderPaidEvent  OrderCancelledEvent  OrderShippedEvent  OrderDeliveredEvent
└── policy/            OrderStateMachine  PriceCalculator  OrderSplitter   # nơi DUY NHẤT đổi trạng thái / tính tiền / tách đơn
```

> Module `promotion` có thêm `policy/` chứa các `PromotionRule` + `DiscountEngine`; `payment` và `shipping` có thêm `gateway/` (interface cổng); `inventory` có `policy/ReservationPolicy`.

## 5.3 Frontend — `frontend-client/`

```
frontend-client/
├── package.json
├── pnpm-lock.yaml                     # (hoặc package-lock.json — chọn MỘT loại)
├── index.html
├── vite.config.ts                     # alias '@' → src, proxy '/api' → http://localhost:8080
├── tsconfig.json
├── tsconfig.node.json
├── eslint.config.js
├── .prettierrc
├── .env.example                       # VITE_API_BASE_URL, VITE_APP_ENV
├── .env.development
├── public/
│   ├── favicon.ico
│   └── robots.txt
├── e2e/                               # Playwright: luồng mua hàng, đăng nhập, seller đăng sản phẩm
└── src/
    ├── main.tsx                       # Điểm vào
    ├── vite-env.d.ts
    │
    ├── app/                           # Khung ứng dụng
    │   ├── App.tsx
    │   ├── providers/                 # AppProviders  QueryProvider  AuthProvider  I18nProvider
    │   ├── router/
    │   │   ├── routes.tsx             # Khai báo toàn bộ route + lazy
    │   │   ├── paths.ts               # Hằng số đường dẫn (không viết chuỗi URL rải rác)
    │   │   └── guards/                # GuestOnly  RequireAuth  RequireRole
    │   └── store/                     # authStore  uiStore  guestCartStore
    │
    ├── pages/                         # MỎNG: chỉ ghép layout + feature, không chứa logic
    │   ├── public/                    # HomePage  ProductListPage  ProductDetailPage  ShopPage
    │   │   │                          # VoucherCenterPage  FlashSalePage
    │   │   └── auth/                  # LoginPage  RegisterPage  ForgotPasswordPage  ResetPasswordPage  VerifyEmailPage
    │   ├── buyer/                     # CartPage  CheckoutPage  PaymentResultPage
    │   │   └── account/               # ProfilePage  AddressBookPage  OrderListPage  OrderDetailPage
    │   │                              # MyVouchersPage  MyReviewsPage
    │   ├── seller/                    # SellerRegisterPage  DashboardPage  ProductListPage  ProductEditorPage
    │   │                              # InventoryPage  OrderListPage  OrderDetailPage  PromotionPage
    │   │                              # ReviewPage  ReportPage  ShopSettingsPage
    │   ├── admin/                     # DashboardPage  ShopApprovalPage  UserManagementPage  CategoryTreePage
    │   │                              # BrandPage  ProductModerationPage  OrderMonitorPage  ReviewModerationPage
    │   │                              # CampaignPage  ReportPage  SettingsPage  AuditLogPage
    │   └── errors/                    # ForbiddenPage  ServerErrorPage  NotFoundPage
    │
    ├── layouts/                       # PublicLayout  AuthLayout  CheckoutLayout  AccountLayout  SellerLayout  AdminLayout
    │
    ├── features/                      # ★ Logic theo nghiệp vụ (mỗi feature theo Feature Template bên dưới)
    │   ├── auth/  account/  catalog/  search/  cart/  checkout/  orders/
    │   ├── payments/  reviews/  promotions/  storefront/  seller/  admin/
    │   └── (Feature Template)
    │       ├── api/               # Hàm gọi API của feature (dùng shared/api/httpClient)
    │       ├── hooks/             # useXxxQuery / useXxxMutation
    │       ├── components/        # Component gắn nghiệp vụ của feature
    │       ├── schemas/           # Schema Zod
    │       ├── types/             # Kiểu dữ liệu (khớp DTO backend)
    │       └── index.ts           # Chỉ export những gì feature khác được dùng
    │
    ├── components/                # Component DÙNG CHUNG, không biết nghiệp vụ
    │   ├── atoms/                 # Button  Input  Select  Checkbox  Radio  Badge  Price  Rating  Skeleton ...
    │   ├── molecules/             # SearchBox  QuantityStepper  FormField  Dropdown  Tabs  Breadcrumb  Toast ...
    │   ├── organisms/             # Modal  Drawer  DataTable  Pagination  ProductCard  ImageGallery  Carousel ...
    │   └── feedback/              # EmptyState  ErrorState  ErrorBoundary  ConfirmDialog
    │
    ├── shared/                    # Hạ tầng FE dùng chung
    │   ├── api/                   # httpClient  interceptors (gắn token, refresh khi 401)  apiError  queryKeys
    │   ├── config/                # env.ts  constants.ts
    │   ├── hooks/                 # useDebounce  useMediaQuery  useUrlState ...
    │   ├── lib/                   # formatMoney  formatDate  cn
    │   ├── utils/
    │   ├── types/                 # ApiResponse  ApiError  PageMeta
    │   └── i18n/locales/          # vi.json  en.json
    │
    ├── styles/
    │   ├── index.css              # @import tailwindcss + base
    │   └── tokens.css             # ★ Design tokens (màu, spacing, radius, shadow, font) — nguồn duy nhất
    ├── assets/
    │   ├── images/  icons/  fonts/
    └── tests/                     # setup.ts, test util; unit test đặt cạnh file nguồn (*.test.tsx)
```

---
