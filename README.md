# 🐔 WebChicKen — Multi-Vendor E-Commerce Marketplace

<p align="center">
  <img src="https://images.unsplash.com/photo-1523474253243-231a511306ec?auto=format&fit=crop&w=1200&q=80" alt="WebChicKen Banner" width="100%" style="border-radius: 12px; max-height: 380px; object-fit: cover;" />
</p>

<p align="center">
  <b>Hệ thống Thương Mại Điện Tử Đa Nhà Bán (Marketplace) quy mô lớn theo kiến trúc Headless Architecture.</b><br/>
  Lấy cảm hứng từ mô hình vận hành của Shopee và Amazon, xây dựng trên nền tảng <b>Java Servlet 6.0 (Jakarta EE)</b> thuần & <b>React TypeScript</b>.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Java-21-orange?style=for-the-badge&logo=openjdk" alt="Java 21" />
  <img src="https://img.shields.io/badge/Jakarta%20Servlet-6.0-blue?style=for-the-badge&logo=apachetomcat" alt="Servlet 6.0" />
  <img src="https://img.shields.io/badge/Apache%20Tomcat-10.1-green?style=for-the-badge&logo=apache" alt="Tomcat 10.1" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon%20DB-blueviolet?style=for-the-badge&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License" />
</p>

---

## 📑 Mục Lục
- [1. Giới Thiệu Dự Án](#-1-giới-thiệu-dự-án)
- [2. Phân Hệ Người Dùng & Tính Năng Chính](#-2-phân-hệ-người-dùng--tính-năng-chính)
- [3. Điểm Nhấn Kỹ Thuật Nổi Bật](#-3-điểm-nhấn-kỹ-thuật-nổi-bật)
- [4. Kiến Trúc Hệ Thống & Công Nghệ](#-4-kiến-trúc-hệ-thống--công-nghệ)
- [5. Cấu Trúc Thư Mục](#-5-cấu-trúc-thư-mục)
- [6. Tài Khoản Trải Nghiệm Mẫu](#-6-tài-khoản-trải-nghiệm-mẫu)
- [7. Hướng Dẫn Cài Đặt & Khởi Chạy](#-7-hướng-dẫn-cài-đặt--khởi-chạy)
- [8. Bộ Quy Tắc Phát Triển (Dev Guidelines)](#-8-bộ-quy-tắc-phát-triển-dev-guidelines)

---

## 🌟 1. Giới Thiệu Dự Án

**WebChicKen** là một nền tảng thương mại điện tử B2C/C2C đa người bán (Multi-vendor Marketplace). Dự án được thiết kế theo tư duy **Headless Monolith** hiện đại:
* **Backend**: Xây dựng bằng **Java Servlet 6.0 thuần** kết hợp với **HikariCP**, **JDBC PreparedStatement**, **Flyway**, đảm bảo hiệu năng cao, kiểm soát chặt chẽ tài nguyên và tuân thủ nguyên lý Clean Architecture & Separation of Concerns.
* **Frontend**: Ứng dụng Single Page Application (SPA) viết bằng **React 19**, **TypeScript** và **Tailwind CSS**, cung cấp trải nghiệm mua sắm và quản lý bán hàng mượt mà, tải trang tức thì.

---

## 👥 2. Phân Hệ Người Dùng & Tính Năng Chính

Hệ thống được chia thành 3 cổng trải nghiệm chuyên biệt:

### 🛒 A. Buyer Portal (Khách Hàng)
* **Khám phá sản phẩm**: Tìm kiếm full-text, lọc theo danh mục, khoảng giá, đánh giá sao, sắp xếp theo giá và độ phổ biến.
* **Chi tiết sản phẩm**: Xem bộ sưu tập hình ảnh, chọn thuộc tính/biến thể (Màu sắc, Dung lượng, Kích cỡ), cập nhật số lượng tồn kho trực tiếp.
* **Giỏ hàng & Khuyến mãi**: Quản lý giỏ hàng theo từng cửa hàng riêng biệt, nhập mã giảm giá sàn & cửa hàng (Voucher Engine).
* **Đặt hàng & Thanh toán**: Quy trình Checkout an toàn, giữ chỗ tồn kho (Stock Reservation), lựa chọn phương thức thanh toán COD hoặc Cổng điện tử.
* **Theo dõi đơn hàng**: Xem lịch sử mua sắm, trạng thái vận chuyển thời gian thực (`PENDING` $\rightarrow$ `CONFIRMED` $\rightarrow$ `SHIPPING` $\rightarrow$ `DELIVERED`).
* **Đánh giá & Phản hồi**: Đánh giá sản phẩm đã mua kèm sao và nhận xét.

### 🏪 B. Seller Channel (Kênh Người Bán)
* **Đăng ký mở gian hàng**: Nộp hồ sơ kinh doanh (Mã số thuế, tên shop, giấy phép) và chờ duyệt từ Admin sàn.
* **Quản trị sản phẩm**: Thêm mới, chỉnh sửa sản phẩm đa biến thể, quản lý bộ sưu tập ảnh và giá bán.
* **Kiểm duyệt tự động**: Hàng hóa an toàn được duyệt mở bán ngay lập tức; các sản phẩm chứa rủi ro y tế/thuốc được tự động đưa vào hàng đợi cảnh báo.
* **Quản lý đơn hàng**: Tiếp nhận đơn, xác nhận xuất kho, chuyển trạng thái giao hàng, xử lý hủy đơn theo đúng State Machine.
* **Gửi phản hồi / Khiếu nại**: Gửi vé hỗ trợ trực tiếp lên Admin sàn khi có sự cố vận hành.

### 🛡️ C. Admin Backoffice (Quản Trị Sàn)
* **Thẩm định Seller**: Xét duyệt hoặc từ chối đơn đăng ký mở gian hàng kèm phản hồi lý do.
* **Kiểm duyệt hàng hóa (Product Moderation)**: Xét duyệt các mặt hàng thuộc nhóm nhạy cảm/y tế hoặc từ chối các sản phẩm vi phạm chính sách sàn.
* **Quản trị người dùng & Phân quyền**: Quản lý tài khoản khách hàng, người bán, khóa tài khoản vi phạm.
* **Quản trị Khuyến mãi**: Tạo và phân phối mã Voucher sàn (Giảm cố định, Giảm theo %, Miễn phí vận chuyển).
* **Audit Logs**: Lưu vết và theo dõi mọi thao tác quản trị quan trọng trong hệ thống.

---

## 🚀 3. Điểm Nhấn Kỹ Thuật Nổi Bật

### 🤖 1. Cơ Chế Kiểm Duyệt 2 Nhánh (Dual-Track Product Moderation)
Hệ thống sử dụng bộ lọc AI/Bot phân tích nội dung tự động:
* **Fast-Track (Tự động duyệt)**: Các sản phẩm thông thường (đồ điện tử, gia dụng, thời trang...) không chứa từ khóa rủi ro sẽ được `SYSTEM: AUTO_APPROVE_BOT` phê duyệt mở bán ngay lập tức (`ACTIVE`), xóa bỏ điểm nghẽn duyệt thủ công cho Seller.
* **Risk Guardrail (Phòng vệ an toàn)**: Sản phẩm phát hiện từ khóa liên quan đến thuốc, kháng sinh, điều trị y tế, hóa chất độc hại, chất cấm sẽ tự động bị giữ lại ở trạng thái `PENDING_APPROVAL`, kèm nhãn cảnh báo rủi ro để Quản trị viên sàn trực tiếp thẩm định.

### ⚡ 2. Quản Trị Đơn Hàng & Kho Bằng State Machine
* Sử dụng cơ chế **Stock Reservation** (giữ hàng tạm thời khi đặt đơn) để chống cạn kiệt kho ảo và giải quyết triệt để bài toán **Race Condition** khi nhiều khách hàng cùng mua một mặt hàng cuối cùng.
* Hủy đơn hoặc thanh toán thất bại tự động hoàn lại số lượng tồn kho an toàn mà không làm sai lệch số liệu.

### 🔒 3. An Toàn Dữ Liệu & Tài Chính
* **Tiền tệ chuẩn Minor Unit**: Sử dụng kiểu số nguyên `long` (VND) để lưu trữ giá trị tiền tệ trong suốt toàn bộ luồng Backend, ngăn ngừa hoàn toàn lỗi làm tròn số thực (`float/double`).
* **Bảo vệ SQL Injection 100%**: Tuyệt đối không nối chuỗi SQL; toàn bộ các thao tác truy vấn CSDL đều dùng `PreparedStatement`.
* **Mật khẩu & Mã hóa**: Băm mật khẩu người dùng bằng giải thuật **BCrypt** với cost factor an toàn.

---

## 🏗️ 4. Kiến Trúc Hệ Thống & Công Nghệ

```
┌────────────────────────────────────────────────────────┐
│                   React 19 + Vite SPA                  │
│       Buyer Portal   │  Seller Center  │ Admin Portal  │
└───────────────────────────┬────────────────────────────┘
                            │ RESTful JSON APIs (/api/v1/...)
┌───────────────────────────▼────────────────────────────┐
│              Apache Tomcat 10.1 (Servlet 6.0)          │
│  Filters: AuthFilter, CorsFilter, ErrorHandlingFilter  │
│                                                        │
│  Modular Services:                                     │
│  ├── Identity & Users        ├── Order & State Machine │
│  ├── Shop & Stores           ├── Payment & Settlement  │
│  ├── Catalog & Products      ├── Promotion & Vouchers  │
│  ├── Inventory Reservation   ├── Review & Ratings      │
│  └── Backoffice & Auditing   └── Media Upload          │
└───────────────────────────┬────────────────────────────┘
                            │ HikariCP Connection Pool
┌───────────────────────────▼────────────────────────────┐
│             PostgreSQL 16 (Neon Serverless)            │
│          Quản lý Migration phiên bản bằng Flyway        │
└────────────────────────────────────────────────────────┘
```

| Tầng | Công nghệ sử dụng |
|---|---|
| **Backend Core** | Java 21, Jakarta Servlet 6.0, Apache Tomcat 10.1 |
| **Database & Pool** | PostgreSQL 16 (Neon DB), HikariCP, Flyway Migration |
| **Thư viện hỗ trợ** | Jackson (JSON), BCrypt (Security), SLF4J + Logback (Logging) |
| **Frontend Core** | React 19, TypeScript 5, Vite 6 |
| **Giao diện & UI** | Tailwind CSS 3, Lucide React Icons, React Router DOM 7 |
| **Testing** | JUnit 5, Mockito (162+ Automated Unit & Integration Tests) |

---

## 📁 5. Cấu Trúc Thư Mục

```
WebChicKen_E-Commerce/
├── backend-servlet/            # Java Servlet Backend (Maven)
│   ├── src/main/java/          # Mã nguồn Backend chia theo 11 module nghiệp vụ
│   │   └── com/example/webchicken/
│   │       ├── bootstrap/      # Khởi tạo DI & AppBootstrapListener
│   │       ├── common/         # Model dùng chung, Exceptions, Helpers
│   │       ├── modules/        # Các module: catalog, order, shop, identity...
│   │       └── web/            # Filter xác thực, CORS, Context Listeners
│   ├── src/main/resources/     # db/migration (Flyway SQL), application.properties
│   └── pom.xml                 # Cấu hình Maven dependencies
├── frontend-client/            # React Single Page Application (Vite)
│   ├── src/
│   │   ├── components/         # UI components dùng chung (Header, Footer, Modal...)
│   │   ├── features/           # Phân hệ tính năng: buyer, seller, admin
│   │   ├── pages/              # Các trang giao diện chính
│   │   ├── services/ & api/    # Axios client và giao tiếp REST API
│   │   └── types/              # Định nghĩa kiểu dữ liệu TypeScript
│   ├── package.json
│   └── vite.config.ts
├── docs/                       # Tài liệu thiết kế hệ thống
│   ├── dev-guides/             # Quy tắc code bất biến, kiến trúc chi tiết
│   ├── api/                    # Đặc tả RESTful API
│   └── CHANGELOG.md            # Nhật ký sửa đổi và cập nhật tính năng
└── infra/                      # Scripts vận hành, triển khai Tomcat tự động
```

---

## 🔑 6. Tài Khoản Trải Nghiệm Mẫu

Mọi tài khoản mẫu đều được mã hóa mật khẩu an toàn và nạp sẵn dữ liệu demo hoàn chỉnh:

| Vai trò | Email / Username | Mật khẩu | Cửa hàng đại diện |
|---|---|---|---|
| 👑 **Quản Trị Viên (Admin)** | `admin@webchicken.com`<br>`admin` | `123456` | *Quản trị toàn sàn* |
| 💻 **Người Bán (Tech Seller)** | `seller1@webchicken.com`<br>`seller_techzone` | `123456` | **TechZone Official Store** |
| 🍳 **Người Bán (Home Seller)** | `seller2@webchicken.com`<br>`seller_sunhouse` | `123456` | **SunHouse Living & Kitchen** |
| 🛋️ **Người Bán (Furniture)** | `seller3@webchicken.com`<br>`seller_nordic` | `123456` | **Nordic Modern Furniture** |

---

## ⚙️ 7. Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Yêu cầu môi trường
* **JDK 21** trở lên.
* **Node.js 18+** & **npm**.
* **Apache Tomcat 10.1** (hoặc sử dụng script tự động đi kèm trong `infra/`).
* **Git**.

### 2. Khởi chạy Backend (Java Servlet)
1. Di chuyển vào thư mục backend:
   ```bash
   cd backend-servlet
   ```
2. Cấu hình biến môi trường CSDL trong file `.env`:
   ```env
   DB_HOST=ep-dry-surf-b3wpwkx6.c-4.ap-southeast-1.aws.neon.tech
   DB_PORT=5432
   DB_NAME=neondb
   DB_USER=neondb_owner
   DB_PASSWORD=your_database_password
   ```
3. Chạy lệnh tự động build và triển khai lên Tomcat (PowerShell):
   ```powershell
   .\infra\scripts\dev-tomcat.ps1 run
   ```
   *Backend sẽ khởi chạy tại: `http://localhost:8080/api/v1/`*

### 3. Khởi chạy Frontend (React SPA)
1. Mở một terminal mới và di chuyển vào thư mục client:
   ```bash
   cd frontend-client
   ```
2. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```
3. Khởi chạy dev server:
   ```bash
   npm run dev
   ```
   *Frontend sẽ khởi chạy tại: `http://localhost:5173/`*

### 4. Chạy Automated Tests (Backend)
Để chạy toàn bộ hơn 160 test case kiểm thử tích hợp và kiểm thử đơn vị:
```bash
cd backend-servlet
.\mvnw.cmd test
```

---

## 📜 8. Bộ Quy Tắc Phát Triển (Dev Guidelines)

Dự án áp dụng các nguyên tắc lập trình bất biến được quy định chi tiết trong thư mục `docs/dev-guides/`:
* **Separation of Concerns**: Controller tuyệt đối không gọi DAO trực tiếp; Service xử lý 100% nghiệp vụ; DAO chỉ phụ trách thao tác lưu trữ CSDL.
* **DTO Isolation**: Tuyệt đối không trả Entity trực tiếp ra API; luôn map qua DTO Response để bảo vệ cấu trúc nội bộ.
* **No Hardcoding**: Toàn bộ cấu hình hệ thống, URL kết nối, thông tin xác thực đều nạp qua biến môi trường.

---

<p align="center">
  Made with ❤️ by <b>WebChicKen Engineering Team</b>
</p>
