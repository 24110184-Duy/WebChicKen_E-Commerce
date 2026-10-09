-- ============================================================
-- V012: Bảng liên kết tài khoản mạng xã hội (Google, Facebook OAuth)
-- ============================================================

CREATE TABLE IF NOT EXISTS user_social_accounts (
    id               VARCHAR(36)  NOT NULL PRIMARY KEY,
    user_id          VARCHAR(36)  NOT NULL,
    provider         VARCHAR(20)  NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    email            VARCHAR(255),
    avatar_url       VARCHAR(500),
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_social_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_social_provider_user UNIQUE (provider, provider_user_id)
);

CREATE INDEX IF NOT EXISTS idx_social_user_id ON user_social_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_provider_user_id ON user_social_accounts(provider, provider_user_id);
