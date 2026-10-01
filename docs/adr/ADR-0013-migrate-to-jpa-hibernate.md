# ADR-0013: Chuyển đổi tầng Persistence sang Jakarta Persistence (JPA 3.1) kết hợp Hibernate ORM 6.5 và HikariCP

## 1. Trạng thái
**ĐÃ CHẤP NHUẬN (ACCEPTED)** — Ngày 2026-10-01.

---

## 2. Ngữ cảnh (Context)
Ban đầu hệ thống WebChicKen sử dụng JDBC thuần và PreparedStatement trực tiếp trong các lớp DAO kế thừa `BaseDAO`.
Theo yêu cầu cập nhật công nghệ, dự án chuyển dịch sang sử dụng tiêu chuẩn **JPA (Jakarta Persistence 3.1)** kết hợp với **Hibernate ORM 6.5** làm JPA Provider, đồng thời tích hợp **HikariCP** làm connection pool để duy trì hiệu năng cao nhất.

---

## 3. Quyết định (Decision)

1. **Công nghệ:**
   - Quản lý phụ thuộc Maven: bổ sung `org.hibernate.orm:hibernate-core:6.5.2.Final` và `org.hibernate.orm:hibernate-hikaricp:6.5.2.Final`.
   - Tiêu chuẩn: Jakarta Persistence 3.1 (`jakarta.persistence.*`), tương thích Servlet 6.0 và JDK 17.
   - Cấu hình: file `src/main/resources/META-INF/persistence.xml` với persistence unit `webchicken-pu`, transaction type `RESOURCE_LOCAL`.

2. **Quản lý Vòng đời (Lifecycle):**
   - `EntityManagerFactory` được tạo 1 lần tại `CompositionRoot.initialize()` và đóng tại `CompositionRoot.shutdown()`.
   - `BaseDAO` hỗ trợ `EntityManagerFactory` và cung cấp các helper `executeQuery()`, `executeInTransaction()`.

3. **Cấu trúc Thư mục DTO:**
   - Bổ sung đầy đủ thư mục `model/dto/request/` và `model/dto/response/` cho toàn bộ 11 module nghiệp vụ (`identity`, `shop`, `catalog`, `inventory`, `cart`, `promotion`, `order`, `payment`, `review`, `media`, `backoffice`).

4. **Nguyên tắc bất biến duy trì:**
   - Schema vẫn do **Flyway** (`db/migration/`) làm nguồn sự thật duy nhất (`jakarta.persistence.schema-generation.database.action = none`).
   - Tuyệt đối không trả Entity ra ngoài API; luôn dùng DTO qua Mapper.
