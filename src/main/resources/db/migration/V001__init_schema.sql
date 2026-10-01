-- ============================================================
-- V001: Schema khởi tạo — WebChicKen
-- Không sửa file này sau khi đã chạy (CODE_PRINCIPLES NAM-09)
-- ============================================================

-- identity
CREATE TABLE IF NOT EXISTS users (
    id           CHAR(36)     NOT NULL PRIMARY KEY,
    email        VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name    VARCHAR(100) NOT NULL,
    phone        VARCHAR(20),
    logo_url     VARCHAR(500),
    logged_in    TINYINT(1)   NOT NULL DEFAULT 0,
    status       ENUM("ACTIVE","LOCKED","BANNED") NOT NULL DEFAULT "ACTIVE",
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS customers (
    id            CHAR(36) NOT NULL PRIMARY KEY,
    tier          ENUM("STANDARD","SILVER","PLATINUM","GOLD") NOT NULL DEFAULT "STANDARD",
    loyalty_point INT      NOT NULL DEFAULT 0,
    CONSTRAINT fk_customers_users FOREIGN KEY (id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sellers (
    id          CHAR(36)     NOT NULL PRIMARY KEY,
    tax_code    VARCHAR(50),
    approved_at DATETIME,
    CONSTRAINT fk_sellers_users FOREIGN KEY (id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS admins (
    id   CHAR(36) NOT NULL PRIMARY KEY,
    role ENUM("SUPER_ADMIN","MODERATOR") NOT NULL DEFAULT "MODERATOR",
    CONSTRAINT fk_admins_users FOREIGN KEY (id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS addresses (
    id             CHAR(36)     NOT NULL PRIMARY KEY,
    user_id        CHAR(36)     NOT NULL,
    recipient_name VARCHAR(100) NOT NULL,
    phone          VARCHAR(20)  NOT NULL,
    address_line1  VARCHAR(255) NOT NULL,
    district       VARCHAR(100) NOT NULL,
    city           VARCHAR(100) NOT NULL,
    is_default     TINYINT(1)   NOT NULL DEFAULT 0,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_addresses_users FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_sessions (
    id             CHAR(36)   NOT NULL PRIMARY KEY,
    user_id        CHAR(36)   NOT NULL,
    cookie_content VARCHAR(512) NOT NULL,
    is_active      TINYINT(1) NOT NULL DEFAULT 1,
    expired_at     DATETIME   NOT NULL,
    CONSTRAINT fk_user_sessions_users FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS account_bans (
    id          CHAR(36)     NOT NULL PRIMARY KEY,
    user_id     CHAR(36)     NOT NULL,
    description VARCHAR(500) NOT NULL,
    banned_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_account_bans_users FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS policy_violation_types (
    id          CHAR(36)     NOT NULL PRIMARY KEY,
    description VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- shop
CREATE TABLE IF NOT EXISTS stores (
    id         CHAR(36)    NOT NULL PRIMARY KEY,
    store_name VARCHAR(100) NOT NULL,
    store_type ENUM("SELLER","BUYER","ADMIN") NOT NULL DEFAULT "SELLER",
    seller_id  CHAR(36)    NOT NULL,
    created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_stores_sellers FOREIGN KEY (seller_id) REFERENCES sellers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS seller_applications (
    id               CHAR(36)     NOT NULL PRIMARY KEY,
    user_id          CHAR(36)     NOT NULL,
    shop_name        VARCHAR(100) NOT NULL,
    document_url     VARCHAR(500),
    status           VARCHAR(30)  NOT NULL DEFAULT "PENDING",
    rejection_reason VARCHAR(500),
    admin_response_id CHAR(36),
    submitted_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at      DATETIME,
    CONSTRAINT fk_seller_applications_users FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS feedback_to_admins (
    id              CHAR(36)     NOT NULL PRIMARY KEY,
    user_id         CHAR(36)     NOT NULL,
    type            VARCHAR(50)  NOT NULL,
    subject         VARCHAR(255) NOT NULL,
    content         TEXT         NOT NULL,
    image_url       VARCHAR(500),
    seller_response TEXT,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at     DATETIME,
    CONSTRAINT fk_feedback_to_admins_users FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- catalog
CREATE TABLE IF NOT EXISTS categories (
    id          CHAR(36)     NOT NULL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS products (
    id          CHAR(36)     NOT NULL PRIMARY KEY,
    store_id    CHAR(36)     NOT NULL,
    category_id CHAR(36)     NOT NULL,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    status      ENUM("PENDING_APPROVAL","ACTIVE","INACTIVE","OUT_OF_STOCK") NOT NULL DEFAULT "PENDING_APPROVAL",
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_stores     FOREIGN KEY (store_id)    REFERENCES stores(id),
    CONSTRAINT fk_products_categories FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS product_images (
    id         CHAR(36)     NOT NULL PRIMARY KEY,
    product_id CHAR(36)     NOT NULL,
    image_url  VARCHAR(500) NOT NULL,
    CONSTRAINT fk_product_images_products FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS product_variants (
    id             CHAR(36)     NOT NULL PRIMARY KEY,
    product_id     CHAR(36)     NOT NULL,
    attribute      VARCHAR(255) NOT NULL,
    base_price_minor BIGINT     NOT NULL DEFAULT 0,
    stock_quantity INT          NOT NULL DEFAULT 0,
    CONSTRAINT fk_product_variants_products FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- cart
CREATE TABLE IF NOT EXISTS carts (
    id          CHAR(36) NOT NULL PRIMARY KEY,
    customer_id CHAR(36) NOT NULL,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_carts_customers FOREIGN KEY (customer_id) REFERENCES customers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cart_items (
    id         CHAR(36) NOT NULL PRIMARY KEY,
    cart_id    CHAR(36) NOT NULL,
    product_id CHAR(36) NOT NULL,
    quantity   INT      NOT NULL DEFAULT 1,
    CONSTRAINT fk_cart_items_carts    FOREIGN KEY (cart_id)    REFERENCES carts(id),
    CONSTRAINT fk_cart_items_products FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- promotion
CREATE TABLE IF NOT EXISTS vouchers (
    id                    CHAR(36)     NOT NULL PRIMARY KEY,
    code                  VARCHAR(50)  NOT NULL UNIQUE,
    type                  ENUM("PERCENTAGE","AMOUNT") NOT NULL,
    discount_value_minor  BIGINT       NOT NULL DEFAULT 0,
    min_order_value_minor BIGINT       NOT NULL DEFAULT 0,
    max_discount_amount_minor BIGINT   NOT NULL DEFAULT 0,
    start_date            DATETIME     NOT NULL,
    end_date              DATETIME     NOT NULL,
    is_active             TINYINT(1)   NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- order
CREATE TABLE IF NOT EXISTS orders (
    id                  CHAR(36)  NOT NULL PRIMARY KEY,
    customer_id         CHAR(36)  NOT NULL,
    order_date          DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status              ENUM("PENDING","CONFIRMED","SHIPPING","DELIVERED","CANCELLED","RETURNED") NOT NULL DEFAULT "PENDING",
    total_amount_minor  BIGINT    NOT NULL DEFAULT 0,
    payment_status      ENUM("UNPAID","PAID","REFUNDED","FAILED") NOT NULL DEFAULT "UNPAID",
    CONSTRAINT fk_orders_customers FOREIGN KEY (customer_id) REFERENCES customers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS order_items (
    id                       CHAR(36) NOT NULL PRIMARY KEY,
    order_id                 CHAR(36) NOT NULL,
    product_id               CHAR(36) NOT NULL,
    quantity                 INT      NOT NULL,
    unit_price_at_purchase_minor BIGINT NOT NULL,
    CONSTRAINT fk_order_items_orders   FOREIGN KEY (order_id)   REFERENCES orders(id),
    CONSTRAINT fk_order_items_products FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS order_cancellations (
    id         CHAR(36) NOT NULL PRIMARY KEY,
    order_id   CHAR(36) NOT NULL,
    cancel_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_cancellations_orders FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cancellation_responses (
    id          CHAR(36)     NOT NULL PRIMARY KEY,
    order_id    CHAR(36)     NOT NULL,
    reason_text VARCHAR(500) NOT NULL,
    has_voucher TINYINT(1)   NOT NULL DEFAULT 0,
    CONSTRAINT fk_cancellation_responses_orders FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- payment
CREATE TABLE IF NOT EXISTS payment_methods (
    id            CHAR(36)     NOT NULL PRIMARY KEY,
    customer_id   CHAR(36)     NOT NULL,
    type          VARCHAR(50)  NOT NULL,
    provider      VARCHAR(100),
    masked_detail VARCHAR(50),
    is_default    TINYINT(1)   NOT NULL DEFAULT 0,
    CONSTRAINT fk_payment_methods_customers FOREIGN KEY (customer_id) REFERENCES customers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payments (
    id              CHAR(36)  NOT NULL PRIMARY KEY,
    order_id        CHAR(36)  NOT NULL,
    amount_minor    BIGINT    NOT NULL,
    status          ENUM("UNPAID","PAID","REFUNDED","FAILED") NOT NULL DEFAULT "UNPAID",
    transaction_ref VARCHAR(255),
    paid_at         DATETIME,
    CONSTRAINT fk_payments_orders FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- review
CREATE TABLE IF NOT EXISTS product_reviews (
    id          CHAR(36)     NOT NULL PRIMARY KEY,
    user_id     CHAR(36)     NOT NULL,
    product_id  CHAR(36)     NOT NULL,
    rating      TINYINT      NOT NULL,
    comment     TEXT,
    edited_by   VARCHAR(100),
    post_at     DATETIME,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_reviews_users    FOREIGN KEY (user_id)    REFERENCES users(id),
    CONSTRAINT fk_product_reviews_products FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- backoffice
CREATE TABLE IF NOT EXISTS audit_logs (
    id          CHAR(36)     NOT NULL PRIMARY KEY,
    admin_id    CHAR(36)     NOT NULL,
    action      VARCHAR(100) NOT NULL,
    target_type VARCHAR(100),
    target_id   CHAR(36),
    detail      TEXT,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
