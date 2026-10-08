-- ============================================================
-- V005: Create Order Status History Table (Audit Trail & Timeline) (PostgreSQL Compatible)
-- ============================================================

CREATE TABLE IF NOT EXISTS order_status_histories (
    id          CHAR(36)     NOT NULL PRIMARY KEY,
    order_id    CHAR(36)     NOT NULL,
    from_status VARCHAR(30),
    to_status   VARCHAR(30)  NOT NULL,
    actor_type  VARCHAR(20)  NOT NULL,
    actor_id    VARCHAR(50),
    reason      VARCHAR(500),
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_status_histories_orders FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE INDEX IF NOT EXISTS idx_order_status_histories_order_id ON order_status_histories(order_id);
