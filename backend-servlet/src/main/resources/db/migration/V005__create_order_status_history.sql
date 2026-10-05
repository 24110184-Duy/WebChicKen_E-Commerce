-- ============================================================
-- V005: Create Order Status History Table (Audit Trail & Timeline)
-- ============================================================

CREATE TABLE IF NOT EXISTS order_status_histories (
    id          CHAR(36)     NOT NULL PRIMARY KEY,
    order_id    CHAR(36)     NOT NULL,
    from_status ENUM('PENDING','CONFIRMED','SHIPPING','DELIVERED','CANCELLED','RETURNED'),
    to_status   ENUM('PENDING','CONFIRMED','SHIPPING','DELIVERED','CANCELLED','RETURNED') NOT NULL,
    actor_type  ENUM('CUSTOMER','SELLER','ADMIN','SYSTEM') NOT NULL,
    actor_id    VARCHAR(50),
    reason      VARCHAR(500),
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_order_status_histories_order_id (order_id),
    CONSTRAINT fk_order_status_histories_orders FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

