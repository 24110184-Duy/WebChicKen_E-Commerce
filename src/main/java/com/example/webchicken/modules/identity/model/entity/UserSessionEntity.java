package com.example.webchicken.modules.identity.model.entity;

import java.time.LocalDateTime;

/**
 * Ánh xạ bảng `user_sessions` — lưu refresh token trong DB.
 * KHÔNG phải HttpSession. Xem ADR-06 và README 2.1 #7.
 */
public class UserSessionEntity {
    private String sessionId;
    private String userId;
    private String cookieContent;   // refresh token (hashed)
    private boolean isActive;
    private LocalDateTime expiredAt;

    public String getSessionId()            { return sessionId; }
    public void setSessionId(String v)      { this.sessionId = v; }
    public String getUserId()               { return userId; }
    public void setUserId(String v)         { this.userId = v; }
    public String getCookieContent()        { return cookieContent; }
    public void setCookieContent(String v)  { this.cookieContent = v; }
    public boolean isActive()               { return isActive; }
    public void setActive(boolean v)        { this.isActive = v; }
    public LocalDateTime getExpiredAt()     { return expiredAt; }
    public void setExpiredAt(LocalDateTime v) { this.expiredAt = v; }
}
