-- ============================================================
-- V016: Tạo bảng chat_messages hỗ trợ giao tiếp giữa Khách hàng và Người bán
-- ============================================================

CREATE TABLE IF NOT EXISTS chat_messages (
    id VARCHAR(36) PRIMARY KEY,
    store_id VARCHAR(36) NOT NULL,
    customer_id VARCHAR(36) NOT NULL,
    sender_type VARCHAR(20) NOT NULL,
    sender_id VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    product_id VARCHAR(36),
    product_name VARCHAR(255),
    product_image VARCHAR(500),
    product_price_minor BIGINT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_store_cust ON chat_messages(store_id, customer_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_customer ON chat_messages(customer_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_store ON chat_messages(store_id, created_at);
