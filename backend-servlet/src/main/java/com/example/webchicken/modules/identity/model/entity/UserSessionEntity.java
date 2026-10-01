package com.example.webchicken.modules.identity.model.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Ánh xạ bảng {@code user_sessions} — lưu refresh token trong DB.
 * KHÔNG phải HttpSession. Xem ADR-06 và README 2.1 #7.
 */
@Entity
@Table(name = "user_sessions")
public class UserSessionEntity {

    @Id
    @Column(name = "id", length = 36, nullable = false, updatable = false)
    private String sessionId;

    @Column(name = "user_id", length = 36, nullable = false, updatable = false)
    private String userId;

    @Column(name = "cookie_content", length = 512, nullable = false)
    private String cookieContent;   // refresh token (hashed)

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "expired_at", nullable = false)
    private LocalDateTime expiredAt;

    public String getSessionId()                { return sessionId; }
    public void setSessionId(String v)          { this.sessionId = v; }
    public String getUserId()                   { return userId; }
    public void setUserId(String v)             { this.userId = v; }
    public String getCookieContent()            { return cookieContent; }
    public void setCookieContent(String v)      { this.cookieContent = v; }
    public boolean isActive()                   { return isActive; }
    public void setActive(boolean v)            { this.isActive = v; }
    public LocalDateTime getExpiredAt()         { return expiredAt; }
    public void setExpiredAt(LocalDateTime v)   { this.expiredAt = v; }
}
