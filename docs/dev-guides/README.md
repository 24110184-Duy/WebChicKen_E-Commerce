# E-Commerce Platform (Amazon / Shopee-style Marketplace)

> [!CAUTION]
> ## 🚨 BẮT BUỘC — MỌI AI VÀ LẬP TRÌNH VIÊN PHẢI ĐỌC TOÀN BỘ FOLDER `docs/dev-guides/` TRƯỚC KHI LÀM BẤT CỨ ĐIỀU GÌ
>
> **Quy trình không được bỏ qua:**
> ```
> ĐỌC README.md (file này)  →  ĐỌC CODE_PRINCIPLES.md  →  ĐỌC ARCHITECTURE.md
>        ↓
> Xác định module + layer  →  Tìm thành phần tái sử dụng  →  Bắt đầu làm
> ```
> Xem `GEMINI.md` / `AGENTS.md` ở root dự án để biết toàn bộ quy tắc bắt buộc.

> ## ⚓ CONTEXT ANCHOR — NGUỒN SỰ THẬT DUY NHẤT
>
> **Dành cho mọi AI (Claude, ChatGPT, Copilot, Cursor, Antigravity agent...) và mọi lập trình viên.**
> File này là *nguồn sự thật duy nhất* về cấu trúc dự án. Trước khi tạo, di chuyển, đổi tên hoặc xóa **bất kỳ** file/thư mục nào, bạn phải:
> 1. Đọc toàn bộ `docs/dev-guides/README.md` này, `CODE_PRINCIPLES.md` và `ARCHITECTURE.md`.
> 2. Xác định **module** và **layer** của thứ bạn sắp tạo (mục 5 và 8).
> 3. Tìm xem đã có thành phần tương tự để **tái sử dụng** chưa.
> 4. Chỉ đặt file vào thư mục **đã được liệt kê** ở mục 5. Nếu không có thư mục phù hợp → **DỪNG và hỏi người dùng** (hoặc đề xuất ADR), không tự tạo.

---

## 1. Tổng quan

Hệ thống thương mại điện tử đa nhà bán (marketplace) quy mô lớn, **Headless**:

| Thành phần | Công nghệ | Thư mục |
|---|---|---|
| Backend API | Java Servlet (Servlet 6.0, `jakarta.*`) · Apache Tomcat 10.1 · JDBC + HikariCP · MySQL 8 · JDK 17 · Maven | `backend-servlet/` |
| Frontend SPA | React + TypeScript + Vite + Tailwind CSS | `frontend-client/` |
| Giao tiếp | RESTful API, JSON, `/api/v1/...` | — |
| Hạ tầng | Nginx (prod) · Docker (MySQL dev) | `infra/` |
| Tài liệu | Kiến trúc, API, BA, ADR, Nhật ký thay đổi | `docs/dev-guides/`, `docs/api/`, `docs/ba/`, `docs/adr/`, [`docs/CHANGELOG.md`](../CHANGELOG.md) |
 
Nghiệp vụ chia 11 module: `identity`, `shop`, `catalog`, `inventory`, `cart`, `promotion`, `order`, `payment`, `review`, `media`, `backoffice`. (Shipping được mô phỏng bằng job định kỳ tự đổi trạng thái, không phải module độc lập.)
 
> [!NOTE]
> **Nhật ký thay đổi & Sửa lỗi (Project Changelog):** Khi tiếp nhận hoặc kéo mã nguồn dự án mới nhất về, vui lòng đọc [`docs/CHANGELOG.md`](../CHANGELOG.md) để cập nhật danh sách các tính năng đã sửa đổi và các lỗi (bug fixes) đã khắc phục.

---

## 2. LUẬT BẮT BUỘC CHO AI (không thương lượng)

### 2.1 Cấm tuyệt đối
1. ❌ **Không tạo thư mục mới** ngoài danh sách ở mục 5. Cần thêm module/thư mục → hỏi trước.
2. ❌ **Không đảo lộn layer**: Controller không gọi DAO; Service không dùng `HttpServletRequest/Response`; DAO không chứa nghiệp vụ.
3. ❌ **Không trả Entity ra API**; luôn dùng DTO Response qua Mapper.
4. ❌ **Không nối chuỗi vào câu truy vấn SQL**; 100% `PreparedStatement` (xem `CODE_PRINCIPLES.md` mục 4).
5. ❌ **Không tự tạo `Connection` / pool**; chỉ dùng `DataSource` do `AppBootstrapListener` dựng.
6. ❌ **Không gọi `DAO`/`Entity` của module khác**; chỉ gọi qua interface `service/` của module đó.
7. ❌ **Không dùng `HttpSession`**; `UserSession` entity chỉ để lưu refresh token trong DB, không phải HTTP session.
8. ❌ **Không lưu token vào `localStorage`**; access token giữ trong bộ nhớ FE, refresh token trong cookie `HttpOnly`.
9. ❌ **Không commit bí mật** (mật khẩu, khóa JWT, khóa cổng thanh toán).
10. ❌ **Không viết logic nghiệp vụ trong Servlet, Filter, `pages/`, hoặc `components/` dùng chung.**
11. ❌ **Không sửa file migration đã tồn tại**; chỉ thêm file mới.
12. ❌ **Không bỏ qua trạng thái**: mọi màn hình FE phải có loading / empty / error.
13. ❌ **Không viết một lớp "thần thánh" (God class)** hay một `Utils` chứa mọi thứ.
14. ❌ **Không đặt logic nghiệp vụ vào Entity** (Customer, Admin, Seller...); method như `checkout()`, `cancelOrder()`, `addProduct()` phải nằm ở **Service**.

### 2.2 Bắt buộc
1. ✅ Dùng **đúng quy ước đặt tên** (mục 7 và `CODE_PRINCIPLES.md` mục 1).
2. ✅ Dependency đi qua **constructor**, nối ở `CompositionRoot`.
3. ✅ Mọi endpoint mới → cập nhật `docs/api/api-catalog.md` và `docs/api/error-codes.md` trong cùng thay đổi.
4. ✅ Mọi thay đổi schema → **một file migration mới** trong `backend-servlet/src/main/resources/db/migration/`.
5. ✅ Lỗi nghiệp vụ ném **exception tùy biến** (`common/exception`), không trả mã trạng thái trong Service.
6. ✅ Mọi danh sách có **phân trang bắt buộc** và trần `size` ≤ 100.
7. ✅ Mọi thao tác ghi dữ liệu nhạy cảm của Admin ghi **audit log**.
8. ✅ Sinh test đi kèm (xem `CODE_PRINCIPLES.md` mục 6).
9. ✅ Giữ thay đổi **nhỏ, đúng phạm vi yêu cầu**; không "tiện tay" refactor chỗ khác.

### 2.3 Quy trình mỗi lần tạo file
```
Đọc README → Xác định module + layer → Tìm thành phần tái sử dụng
→ Đặt file đúng thư mục (mục 5) + đúng tên (mục 7) → Cập nhật docs liên quan → Viết test
```

---

## 3. Sơ đồ kiến trúc tổng quan

```
┌──────────────────────────────── TRÌNH DUYỆT ───────────────────────────────┐
│  frontend-client (React SPA)                                                 │
│  pages → features(hooks/api) → shared/api/httpClient ──► JSON over HTTPS     │
└───────────────────────────────────────┬──────────────────────────────────────┘
                                        │  /api/v1/**
                              ┌─────────▼─────────┐
                              │   Nginx (prod)    │  tĩnh SPA ◄── "/"   ·   "/api" ──► Tomcat
                              └─────────┬─────────┘
┌───────────────────────────────────────▼──────────────────────────────────────┐
│  Apache Tomcat 10.1  ·  backend-servlet (ROOT.war)                             │
│                                                                               │
│  FILTER CHAIN: RequestId → GlobalException → Encoding → CORS → SecHeaders     │
│                → RateLimit → Authentication → CsrfGuard → Authorization       │
│                                                                               │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────────┐   ┌──────────────┐ │
│  │ CONTROLLER   │──►│   SERVICE    │──►│  REPOSITORY    │──►│ HikariCP     │ │
│  │ (Servlet)    │   │ (nghiệp vụ)  │   │ (interface)    │   │  Pool        │ │
│  │ HTTP ⇄ DTO   │   │ + Tx + Event │   │ Jdbc* (cài đặt)│   └──────┬───────┘ │
│  └──────────────┘   └──────┬───────┘   └────────────────┘          │         │
│        ▲                   │ gọi service module khác / gateway      │         │
│        │ BaseApiServlet    ▼                                        │         │
│  ┌─────┴─────────┐  ┌───────────────┐                              │         │
│  │ web/ (base,   │  │ infrastructure│ payment/shipping/mail/storage│         │
│  │ filter,support│  │ (adapter, JWT,│ event bus, tx manager)        │         │
│  └───────────────┘  └───────────────┘                              │         │
└─────────────────────────────────────────────────────────────────────┼─────────┘
                                                                      ▼
                                                              ┌──────────────┐
                                                              │  MySQL 8.0+  │
                                                              └──────────────┘
```

**Hướng phụ thuộc cho phép (chỉ đi xuống / vào trong):**

| Từ ↓ \ Đến → | controller | service | dao | model | common | infrastructure | web |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| **controller** | — | ✔ (interface) | ❌ | ✔ (DTO) | ✔ | ❌ | ✔ |
| **service** | ❌ | ✔ (interface, kể cả module khác) | ✔ (DAO của CHÍNH module) | ✔ | ✔ | ✔ (interface kỹ thuật) | ❌ |
| **dao** | ❌ | ❌ | — | ✔ (entity) | ✔ | ✔ (persistence/BaseDAO) | ❌ |
| **mapper** | ❌ | ❌ | ❌ | ✔ | ✔ | ❌ | ❌ |
| **infrastructure** | ❌ | ❌ | ❌ | ❌ | ✔ | — | ❌ |

---

## 4. Luồng dữ liệu (Data Flow)

### 4.1 Từ Request đến Database và quay lại Frontend

1. **Frontend**: component gọi hook (`features/<x>/hooks`) → hook gọi hàm trong `features/<x>/api` → qua `shared/api/httpClient` (tự gắn `Authorization`, `Accept-Language`, `X-Request-Id`).
2. **Nginx** nhận `/api/v1/**` và chuyển vào Tomcat (cùng origin ở prod).
3. **Filter chain** chạy theo thứ tự cố định ở `WEB-INF/web.xml`: gắn `requestId` → bắt lỗi toàn cục → UTF-8 → CORS → header bảo mật → giới hạn tần suất → **xác thực JWT** → CSRF (chỉ endpoint dùng cookie) → **phân quyền theo vai trò**.
4. **Controller** (`modules/<m>/controller/*Servlet`, kế thừa `BaseApiServlet`): `PathRouter` chọn handler → đọc path/query/body (`RequestBodyReader`) thành **DTO Request** → validate sơ bộ (hình thức) → gọi **một** phương thức của Service interface.
5. **Service** (`modules/<m>/service/impl`): kiểm quyền sở hữu tài nguyên → validate nghiệp vụ → mở ranh giới giao dịch bằng `TransactionManager` (nếu có ghi) → gọi DAO và Service module khác → áp quy tắc (state machine, tính giá, giữ kho...) → xây kết quả.
6. **DAO** (`modules/<m>/dao/*DAO` kế thừa `BaseDAO`): lấy kết nối từ `ConnectionContext` (trong giao dịch) hoặc từ `DataSource` → `PreparedStatement` tham số hóa → ánh xạ hàng thành **Entity**; tài nguyên đóng bằng `try-with-resources`.
7. **MySQL** thực thi; kết quả quay về DAO → Service.
8. **Service** commit giao dịch → phát **Domain Event** (sau commit) → trả Entity/VO cho Controller.
9. **Mapper** chuyển Entity → **DTO Response**; Controller bọc vào `ApiResponse` (`success`, `data`, `meta`, `requestId`, `timestamp`) qua `ResponseWriter`, trả đúng HTTP status.
10. **Frontend**: `httpClient` giải mã; thành công → TanStack Query cập nhật cache → component render; lỗi → đọc `error.code` → hiển thị thông báo/biểu mẫu lỗi.

### 4.2 Luồng lỗi
```
Bất kỳ tầng ném AppException ──► (không ai nuốt/log trùng) ──► BaseApiServlet / GlobalExceptionFilter
 ──► ánh xạ ErrorCode → HTTP status ──► ApiError (code, message theo locale, details) ──► Frontend
Ngoại lệ không lường trước ──► 500 + requestId (KHÔNG lộ stack trace) ; log đầy đủ MỘT lần tại biên
```

### 4.3 Luồng sự kiện (giữa module)
```
Service ghi dữ liệu ─► commit ─► EventBus.publish(DomainEvent) ─► Listener ở module khác (async, có giới hạn)
Ví dụ: PaymentSucceeded ─► order chuyển CREATED→PAID ─► inventory chuyển giữ kho sang COMMITTED
```

---

## 5. Bảng tra cứu vai trò TỪNG thư mục

### 5.1 Root

| Đường dẫn | Vai trò | Được chứa | Cấm |
|---|---|---|---|
| `backend-servlet/` | Backend Maven project | Source Java, pom.xml, mvnw | Frontend code |
| `frontend-client/` | Frontend Vite/React project | Source TS/React, package.json | Backend code |
| `docs/dev-guides/README.md` | Context Anchor | Cấu trúc, luật, luồng dữ liệu | Hướng dẫn riêng lẻ của một module |
| `docs/dev-guides/CODE_PRINCIPLES.md` | Bộ luật code | Quy ước, bảo mật, hiệu năng, tái sử dụng | — |
| `docs/dev-guides/ARCHITECTURE.md` | Kiến trúc chi tiết | Module, state machine, API, màn hình FE | — |
| `docs/` | Tài liệu | Mọi tài liệu dạng Markdown/sơ đồ | Code chạy được |
| `docs/api/` | Đặc tả API | `api-catalog.md`, `error-codes.md` | — |
| `docs/adr/` | Quyết định kiến trúc | `ADR-NNNN-<tên>.md` | — |
| `docs/ba/module-specs/` | Đặc tả nghiệp vụ module | Một file/module | — |
| `docs/ba/user-stories/` | User Story + AC | Given/When/Then | — |
| `docs/ba/state-machines/` | Sơ đồ trạng thái | Order, Payment, Inventory | — |
| `docs/db/` | Dữ liệu | ERD, `data-dictionary.md` | Script SQL chạy thật (để ở `db/migration`) |
| `infra/nginx/` | Mẫu cấu hình Nginx | `site.conf.template` | Bí mật |
| `infra/tomcat/` | Mẫu cấu hình Tomcat | `setenv.sh.template`, ghi chú `server.xml` | Bí mật |
| `infra/mysql/` | Mẫu cấu hình MySQL | `my.cnf.example` | — |
| `infra/docker/` | Môi trường dev | `docker-compose.dev.yml` | Cấu hình prod |
| `infra/scripts/` | Script vận hành | Build/deploy/rollback | Logic nghiệp vụ |

### 5.2 Backend — `backend-servlet/` (gốc Java: `backend-servlet/src/main/java/com/example/webchicken/`)

| Đường dẫn (tính từ gốc Java) | Vai trò | Được chứa | Cấm |
|---|---|---|---|
| `backend-servlet/pom.xml` | Build Maven | Phụ thuộc, profile, plugin | Phụ thuộc không dùng |
| `backend-servlet/config/` | Cấu hình mặc định/theo môi trường | `application*.properties` (không bí mật), file `.example` | Mật khẩu, khóa |
| `bootstrap/` | Khởi động/tắt | `AppBootstrapListener`, `CompositionRoot`, `ScheduledJobsListener` | Nghiệp vụ |
| `config/` | Đọc & mô hình hóa cấu hình | `ConfigLoader`, `ConfigKeys`, `AppConfig`, `DataSourceFactory`, `*Settings` | Nghiệp vụ |
| `web/base/` | Khung Controller dùng chung | `BaseApiServlet`, `PathRouter`, `RequestContext`, `RequestBodyReader`, `ResponseWriter` | Logic của một module cụ thể |
| `web/filter/` | Filter | 9 filter đã nêu (thứ tự ở `web.xml`) | Nghiệp vụ, truy cập DB |
| `web/security/` | Mô hình bảo mật tầng web | `AuthenticatedPrincipal`, `AccessRules` | Băm mật khẩu/ký token (để ở infrastructure) |
| `web/support/` | Tiện ích request | `PaginationParams`, `SortParams`, `LocaleResolver` | Nghiệp vụ |
| `common/constant/` | Hằng số dùng chung | `ApiPaths`, `HeaderNames` | Hằng số riêng của một module |
| `common/enums/` | Enum dùng chung | `RoleName`, `SortDirection`... | Enum riêng của module |
| `common/exception/` | Hệ phân cấp exception | `AppException` và các lớp con, `ErrorCode` | Exception riêng của module (để ở `modules/<m>/exception`) |
| `common/model/` | Mô hình dùng chung | `ApiResponse`, `ApiError`, `PageRequest`, `PageResult`, `Money` | Entity/DTO của module |
| `common/validation/` | Validate dùng chung | Quy tắc & tiện ích validate | Validate riêng của module |
| `common/util/` | Tiện ích thuần | `JsonMapper`, `DateTimeUtils`, `SlugUtils`, `IdGenerator` | Trạng thái, truy cập DB, nghiệp vụ |
| `infrastructure/persistence/` | Nền tảng JDBC | `BaseDAO`, `TransactionManager`, `ConnectionContext`, `RowMapper`, `StatementBinder` | Truy vấn của một bảng cụ thể |
| `infrastructure/security/` | Bảo mật kỹ thuật | `JwtTokenService`, `PasswordHasher` | Quy tắc phân quyền nghiệp vụ |
| `infrastructure/event/` | Event bus | `DomainEvent`, `EventBus`, `InMemoryEventBus` | Event của module (để ở `modules/<m>/event`) |
| `infrastructure/cache/` | Cache | `CacheService`, `InMemoryCache` | — |
| `infrastructure/scheduling/` | Lập lịch | `JobScheduler` | Nội dung job nghiệp vụ |
| `infrastructure/mail/` | Gửi mail | `MailSender` + adapter | Soạn nội dung nghiệp vụ |
| `infrastructure/storage/` | Adapter lưu tệp | Cài đặt `FileStorage` | Quy tắc kiểm tra tệp (ở `media`) |
| `infrastructure/payment/` | Adapter cổng thanh toán | Một lớp/cổng cài đặt `PaymentGateway` | Trạng thái giao dịch (ở `payment`) |
| `infrastructure/shipping/` | Adapter hãng vận chuyển | Một lớp/hãng cài đặt `CarrierGateway` | Tính phí nghiệp vụ (ở `shipping`) |
| `modules/<m>/controller/` | Servlet của module | `*Servlet` (`@WebServlet`) | Logic, truy cập DB |
| `modules/<m>/service/` | Hợp đồng nghiệp vụ | **Interface** `*Service` | Cài đặt |
| `modules/<m>/service/impl/` | Cài đặt nghiệp vụ | `*ServiceImpl` | `jakarta.servlet.*` |
| `modules/<m>/dao/` | Lớp truy cập CSDL (DAO) | `*DAO` (kế thừa `BaseDAO`, viết hàm JDBC trực tiếp) | Logic nghiệp vụ, HTTP |
| `modules/<m>/model/entity/` | Entity | `*Entity` khớp bảng | Logic nghiệp vụ phức tạp, annotation web |
| `modules/<m>/model/dto/request/` | DTO vào | `*Request` | Trường server quyết định (id, owner, trạng thái) |
| `modules/<m>/model/dto/response/` | DTO ra | `*Response` | Dữ liệu nhạy cảm |
| `modules/<m>/model/vo/` | Value Object | Lớp/enum bất biến | Setter, định danh |
| `modules/<m>/mapper/` | Chuyển đổi | `*Mapper` | Truy cập DB |
| `modules/<m>/validator/` | Validate chi tiết | `*RequestValidator` | Truy cập DB (kiểm tra trùng làm ở Service) |
| `modules/<m>/exception/` | Exception đặc thù | Lớp con của `BusinessException` | — |
| `modules/<m>/event/` | Domain event | `*Event` | Logic xử lý (nằm ở listener/service) |
| `modules/<m>/policy/` | Rule/Engine/State machine | `OrderStateMachine`, `PromotionRule`, `DiscountEngine`, `ReservationPolicy`... | Truy cập HTTP |
| `modules/<m>/gateway/` | Interface cổng ra ngoài | `PaymentGateway`, `CarrierGateway` | Cài đặt (để ở `infrastructure/`) |
| `backend-servlet/src/main/resources/db/migration/` | Migration | `V<n>__<mô-tả>.sql` (chỉ thêm mới) | Sửa file đã chạy |
| `backend-servlet/src/main/resources/i18n/` | Thông điệp đa ngôn ngữ | `messages_vi/en.properties` | Văn bản hard-code trong code |
| `backend-servlet/src/main/resources/logback.xml` | Cấu hình log | Pattern có `requestId` | — |
| `backend-servlet/src/main/webapp/WEB-INF/web.xml` | Deployment descriptor | Thứ tự filter, session-config, error-page | Khai báo servlet thừa (đã có `@WebServlet`) |
| `backend-servlet/src/test/java/...` | Test | Phản chiếu cấu trúc `main` | — |
| `backend-servlet/src/test/java/.../it/` | Integration test | Test với MySQL tạm | Phụ thuộc DB dùng chung |

### 5.3 Frontend — `frontend-client/`

| Đường dẫn (tính từ `frontend-client/`) | Vai trò | Được chứa | Cấm |
|---|---|---|---|
| `package.json`, lockfile | Phụ thuộc | Chỉ **một** loại lockfile | Cài thư viện trùng chức năng |
| `vite.config.ts` | Build/dev | Alias `@`, proxy `/api` | — |
| `.env.example` | Mẫu biến môi trường | `VITE_*` | Bí mật |
| `e2e/` | Test đầu-cuối | Kịch bản Playwright | — |
| `src/main.tsx` | Điểm vào | Mount ứng dụng | Logic |
| `src/app/` | Khung ứng dụng | `App.tsx`, `providers/`, `router/`, `store/` | Màn hình |
| `src/app/router/` | Định tuyến | `routes.tsx`, `paths.ts`, `guards/` | Logic nghiệp vụ |
| `src/app/store/` | Trạng thái UI toàn cục | `authStore`, `uiStore`, `guestCartStore` | Sao chép dữ liệu server |
| `src/pages/public\|buyer\|seller\|admin\|errors/` | Trang (mỏng) | Ghép `layout` + `feature` | Logic, gọi API trực tiếp |
| `src/layouts/` | Bố cục trang | 6 layout đã nêu | Dữ liệu nghiệp vụ |
| `src/features/<f>/api/` | Gọi API của feature | Hàm request | Component |
| `src/features/<f>/hooks/` | Hook dữ liệu | `useXxxQuery`, `useXxxMutation` | JSX |
| `src/features/<f>/components/` | Component có nghiệp vụ | UI của feature | Dùng chung nhiều feature (đưa lên `components/`) |
| `src/features/<f>/schemas/` | Schema validate | Zod | — |
| `src/features/<f>/types/` | Kiểu dữ liệu | Khớp DTO backend | — |
| `src/features/<f>/index.ts` | Cổng công khai | Chỉ export cần thiết | Import "sâu" từ feature khác |
| `src/components/atoms/` | Nguyên tử UI | Button, Input, Badge, Price... | Gọi API, biết nghiệp vụ |
| `src/components/molecules/` | Phân tử UI | SearchBox, QuantityStepper... | Gọi API |
| `src/components/organisms/` | Tổ chức UI | Modal, DataTable, ProductCard... | Gọi API trực tiếp |
| `src/components/feedback/` | Trạng thái phản hồi | EmptyState, ErrorState, ErrorBoundary | — |
| `src/shared/api/` | Tầng HTTP | `httpClient`, `interceptors`, `apiError`, `queryKeys` | Logic của feature |
| `src/shared/config/` | Cấu hình FE | `env.ts`, `constants.ts` | — |
| `src/shared/hooks/` | Hook tiện ích | `useDebounce`, `useMediaQuery`... | Hook nghiệp vụ |
| `src/shared/lib/` | Hàm định dạng | `formatMoney`, `formatDate`, `cn` | — |
| `src/shared/utils/` | Tiện ích thuần | Hàm không trạng thái | — |
| `src/shared/types/` | Kiểu chung | `ApiResponse`, `ApiError`, `PageMeta` | Kiểu riêng của feature |
| `src/shared/i18n/locales/` | Bản dịch | `vi.json`, `en.json` | Chuỗi cứng trong JSX |
| `src/styles/tokens.css` | **Design tokens (nguồn duy nhất)** | Màu, spacing, radius, shadow, font | Mã màu/số cứng trong component |
| `src/styles/index.css` | CSS gốc | Import Tailwind, base | — |
| `src/assets/` | Tài nguyên tĩnh | ảnh, icon, font | Dữ liệu nghiệp vụ |
| `src/tests/` | Cấu hình test | `setup.ts` | — |

---

## 6. Bản đồ module ↔ tiền tố API

| Module | Tiền tố endpoint | Servlet chính (trong `controller/`) |
|---|---|---|
| identity | `/auth/*`, `/users/me/*`, `/customers/*`, `/sellers/*`, `/admin/users/*` | `AuthServlet`, `CustomerServlet`, `SellerServlet`, `AdminUserServlet` |
| shop | `/stores/*`, `/stores/{id}`, `/seller-applications/*`, `/admin/stores/*` | `StoreServlet`, `SellerApplicationServlet`, `AdminStoreServlet` |
| catalog | `/categories`, `/products`, `/products/{id}/*`, `/stores/{id}/products/*`, `/admin/categories`, `/admin/products` | `CategoryServlet`, `ProductServlet`, `SellerProductServlet`, `AdminCatalogServlet` |
| inventory | `/stores/{id}/inventory/*` | `InventoryServlet` |
| cart | `/carts/current/*` | `CartServlet` |
| promotion | `/vouchers`, `/users/me/vouchers`, `/stores/{id}/vouchers`, `/admin/vouchers` | `VoucherServlet`, `AdminVoucherServlet` |
| order | `/checkouts/*`, `/orders/*`, `/stores/{id}/orders/*`, `/admin/orders/*` | `CheckoutServlet`, `OrderServlet`, `SellerOrderServlet`, `AdminOrderServlet` |
| payment | `/payment-methods`, `/orders/{id}/payments`, `/payments/*` | `PaymentServlet` |
| review | `/products/{id}/reviews*`, `/reviews/*`, `/orders/{id}/items/{id}/reviews`, `/admin/reviews/*` | `ReviewServlet`, `AdminReviewServlet` |
| media | `/media/uploads` | `MediaUploadServlet` |
| backoffice | `/admin/reports/*`, `/admin/settings/*`, `/admin/audit-logs`, `/system/health*` | `ReportServlet`, `SettingServlet`, `AuditLogServlet`, `HealthServlet` |

---

## 7. Quy ước đặt tên nhanh (chi tiết: `CODE_PRINCIPLES.md` mục 1)

| Đối tượng | Mẫu | Ví dụ |
|---|---|---|
| Servlet | `<Tài nguyên>Servlet` | `ProductServlet` |
| Service interface / impl | `<Aggregate>Service` / `<Aggregate>ServiceImpl` | `OrderService` / `OrderServiceImpl` |
| Repository interface / impl | `<Aggregate>Repository` / `Jdbc<Aggregate>Repository` | `ProductVariantRepository` / `JdbcProductVariantRepository` |
| Entity / DTO / VO | `<X>Entity` / `<Hành động><X>Request`, `<X>Response` / tên khái niệm | `ProductEntity` / `CreateProductRequest` / `Money` |
| Mapper / Validator | `<X>Mapper` / `<Request>Validator` | `ProductMapper` |
| Event | `<Sự kiện quá khứ>Event` | `OrderConfirmedEvent` |
| Bảng / cột MySQL | `snake_case`, bảng số nhiều | `order_items.product_id` |
| Component React | `PascalCase` | `ProductCard.tsx` |
| Hook | `useCamelCase` | `useProductSearch.ts` |
| File thường FE | `camelCase` hoặc `kebab-case` (nhất quán theo thư mục) | `formatMoney.ts` |

---

## 8. "Tôi cần thêm X — đặt ở đâu?"

| Nhu cầu | Đặt ở | Việc kèm theo |
|---|---|---|
| Endpoint mới của module có sẵn | `modules/<m>/controller/*Servlet` (thêm route) + `service/` + (nếu cần) `repository/` | Cập nhật `api-catalog.md`, `error-codes.md`, test |
| Module nghiệp vụ mới | **Hỏi trước** → tạo ADR → `modules/<tên>/` theo **Module Template** | `docs/ba/module-specs/`, thêm vào mục 6 |
| Quy tắc nghiệp vụ mới | `modules/<m>/service/impl` hoặc `policy/` | Test đơn vị |
| Cổng thanh toán / hãng vận chuyển mới | Adapter ở `infrastructure/payment|shipping/` (cài interface `gateway/` của module) | Đăng ký ở `CompositionRoot`, cấu hình khóa qua config |
| Bảng/cột mới | File mới ở `db/migration/` + Entity + Repository | Cập nhật `docs/db/data-dictionary.md` |
| Mã lỗi mới | `common/exception/ErrorCode` + `docs/api/error-codes.md` + `i18n/messages_*` | — |
| Filter mới | `web/filter/` + khai báo thứ tự ở `web.xml` | Ghi rõ vị trí trong chuỗi |
| Trang FE mới | `pages/<khu-vực>/` + route ở `app/router/routes.tsx` + `paths.ts` | Bọc guard, lazy load |
| Logic gọi API mới ở FE | `features/<f>/api` + `hooks` | Thêm khóa ở `shared/api/queryKeys` |
| Component UI dùng chung | `components/atoms|molecules|organisms` | Không biết nghiệp vụ; có story/test |
| Component gắn nghiệp vụ | `features/<f>/components` | — |
| Màu / spacing / font | `styles/tokens.css` | **Không** viết giá trị cứng trong component |
| Biến môi trường | `ConfigKeys` + `config/*.properties` (BE) · `.env.example` + `shared/config/env.ts` (FE) | Bí mật chỉ qua env |

---

## 9. Quy trình thêm một tính năng (checklist)

- [ ] Viết/ cập nhật user story + AC ở `docs/ba/user-stories/`.
- [ ] Cập nhật `docs/api/api-catalog.md` (endpoint, quyền, mã trạng thái, lỗi).
- [ ] Migration (nếu có) → Entity → Repository (interface + Jdbc).
- [ ] DTO Request/Response → Mapper → Validator.
- [ ] Service (interface + impl) → ném exception đúng loại.
- [ ] Controller (Servlet) → route trong `PathRouter`.
- [ ] Cập nhật `CompositionRoot` nếu có thành phần mới.
- [ ] Test đơn vị Service + integration test Repository.
- [ ] Frontend: `features/<f>` (api → hooks → components) → page → route.
- [ ] Đủ loading / empty / error; responsive; truy cập bằng bàn phím.
- [ ] Tự rà theo mục 10 (Definition of Done).

---

## 10. Definition of Done

- [ ] Biên dịch & test xanh (BE: `verify`; FE: lint + type-check + test).
- [ ] Không vi phạm bất kỳ mục nào ở **2.1**.
- [ ] Không có `Connection`/`Statement`/`ResultSet` rò rỉ; không có SQL nối chuỗi.
- [ ] Mọi danh sách có phân trang + trần kích thước.
- [ ] API khớp tài liệu; lỗi có `error.code` ổn định.
- [ ] Không có bí mật hay dữ liệu cá nhân trong log/commit.
- [ ] Tài liệu liên quan đã cập nhật trong cùng thay đổi.

---

## 11. Chạy dự án nhanh (môi trường dev)

1. Khởi động MySQL dev: dùng `infra/docker/docker-compose.dev.yml`.
2. Tạo file cấu hình cục bộ từ `backend-servlet/config/application-dev.properties` và đặt bí mật qua biến môi trường.
3. Build WAR: `cd backend-servlet && ./mvnw -P dev clean package` → `backend-servlet/target/ROOT.war`.
4. Deploy `ROOT.war` vào `webapps/` của Tomcat 10.1 (xem `docs/dev-guides/ARCHITECTURE.md` Phần 1).
5. Chạy FE: `cd frontend-client && npm install && npm run dev` (cổng 5173, proxy `/api` → `localhost:8080`).
6. Kiểm tra: `GET /api/v1/system/health/ready` → 200.

---

## 12. Mục lục tài liệu

| Tài liệu | Nội dung |
|---|---|
| `docs/dev-guides/README.md` | Context Anchor (file này) |
| `docs/dev-guides/CODE_PRINCIPLES.md` | Bộ luật code bất biến |
| `docs/dev-guides/ARCHITECTURE.md` | Thiết lập Tomcat · Phân rã BA · API · Màn hình FE · Cây thư mục |
| `docs/api/` | Danh mục API & mã lỗi |
| `docs/ba/` | Đặc tả nghiệp vụ, user story, state machine |
| `docs/adr/` | Các quyết định kiến trúc |
