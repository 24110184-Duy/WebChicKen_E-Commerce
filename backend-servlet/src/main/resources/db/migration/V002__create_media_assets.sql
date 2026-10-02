-- ============================================================
-- V002: Bảng lưu trữ siêu dữ liệu media assets
-- ============================================================
CREATE TABLE IF NOT EXISTS media_assets (
    id           CHAR(36)     NOT NULL PRIMARY KEY,
    user_id      CHAR(36),
    file_name    VARCHAR(255) NOT NULL,
    file_url     VARCHAR(500) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_size    BIGINT       NOT NULL,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_media_assets_users FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
