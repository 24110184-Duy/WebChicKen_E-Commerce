# ⚠️ QUY TẮC BẮT BUỘC — ĐỌC TRƯỚC KHI LÀM BẤT CỨ ĐIỀU GÌ

> Áp dụng cho **mọi AI** (Antigravity, Claude, ChatGPT, Copilot, Cursor...) và **mọi lập trình viên**.
> Không có ngoại lệ. Không được bỏ qua. Không được tự ý làm mà chưa đọc.

---

## 🔴 LỆNH BẮT BUỘC TRƯỚC MỌI HÀNH ĐỘNG

**Trước khi thực hiện BẤT KỲ prompt, yêu cầu hoặc tác vụ nào**, bạn PHẢI đọc toàn bộ 3 file sau theo thứ tự:

| Thứ tự | File | Đường dẫn | Nội dung |
|---|---|---|---|
| 1️⃣ | `README.md` | `docs/dev-guides/README.md` | Context Anchor — cấu trúc dự án, luật bắt buộc, flow dữ liệu, danh mục thư mục |
| 2️⃣ | `CODE_PRINCIPLES.md` | `docs/dev-guides/CODE_PRINCIPLES.md` | Bộ luật code bất biến — naming, resource, exception, security, performance |
| 3️⃣ | `ARCHITECTURE.md` | `docs/dev-guides/ARCHITECTURE.md` | Kiến trúc chi tiết — module, state machine, API, màn hình FE, cây thư mục |

---

## 🔴 QUY TRÌNH BẮT BUỘC

```
[NHẬN PROMPT]
     ↓
[ĐỌC docs/dev-guides/README.md]          ← BẮT BUỘC, không bỏ qua
     ↓
[ĐỌC docs/dev-guides/CODE_PRINCIPLES.md] ← BẮT BUỘC, không bỏ qua
     ↓
[ĐỌC docs/dev-guides/ARCHITECTURE.md]    ← BẮT BUỘC, không bỏ qua
     ↓
[Xác định module + layer của tác vụ]
     ↓
[Tìm thành phần có thể tái sử dụng]
     ↓
[Thực hiện yêu cầu theo đúng luật]
```

---

## 🔴 CÁC VI PHẠM NGHIÊM TRỌNG (dừng ngay, không làm tiếp)

Nếu AI chưa đọc `docs/dev-guides/` mà đã bắt đầu sinh code hoặc tạo file → **VI PHẠM NGHIÊM TRỌNG**.

Các hành động cấm tuyệt đối (xem chi tiết trong `README.md` mục 2.1):
- ❌ Tự tạo thư mục mới ngoài danh sách đã liệt kê
- ❌ Để logic nghiệp vụ trong Entity (Customer, Admin, Seller...)
- ❌ Dùng double/float cho tiền — phải dùng long (minor unit)
- ❌ Nối chuỗi vào SQL — 100% PreparedStatement
- ❌ Gọi DAO/Entity của module khác trực tiếp
- ❌ Dùng HttpSession — UserSession chỉ là entity lưu refresh token trong DB
- ❌ Commit bí mật (password, JWT key, payment key)
- ❌ Sửa file migration đã tồn tại

---

## 📌 Thông tin dự án nhanh

| Hạng mục | Giá trị |
|---|---|
| Tên dự án | WebChicKen — E-Commerce Marketplace |
| Backend | Java Servlet 6.0 · jakarta.* · Tomcat 10.1 · MySQL 8 · HikariCP · Maven — thư mục `backend-servlet/` |
| Frontend | React + TypeScript + Vite + Tailwind CSS — thư mục `frontend-client/` |
| Package gốc | com.example.webchicken |
| Modules | identity, shop, catalog, inventory, cart, promotion, order, payment, review, media, backoffice |
| OrderStatus | PENDING → CONFIRMED → SHIPPING → DELIVERED; nhánh: CANCELLED, RETURNED |
| PaymentStatus | UNPAID → PAID → REFUNDED / FAILED |
| ProductStatus | PENDING_APPROVAL → ACTIVE / INACTIVE / OUT_OF_STOCK |
| LoyaltyTier | STANDARD / SILVER / PLATINUM / GOLD |
| AdminRole | SUPER_ADMIN / MODERATOR |

---

## 📁 Cấu trúc thư mục gốc

```
WebChicKen_E-Commerce/
├── backend-servlet/      ← Java Servlet backend (Maven project)
│   ├── pom.xml
│   ├── mvnw / mvnw.cmd
│   ├── .mvn/
│   └── src/
│       ├── main/java/    ← Source code Java
│       ├── main/resources/
│       └── main/webapp/
├── frontend-client/      ← React SPA (Vite)
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
├── docs/                 ← Tài liệu dự án
│   ├── dev-guides/       ← README.md, CODE_PRINCIPLES.md, ARCHITECTURE.md
│   ├── api/
│   ├── ba/
│   ├── adr/
│   └── db/
└── infra/                ← Cấu hình hạ tầng (Nginx, Docker, Tomcat)
```

---

*File này được tự động nạp bởi Antigravity IDE trước mỗi prompt. Không xóa, không sửa nếu không có ADR.*
