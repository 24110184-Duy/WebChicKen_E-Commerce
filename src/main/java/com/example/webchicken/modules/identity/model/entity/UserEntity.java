package com.example.webchicken.modules.identity.model.entity;

import com.example.webchicken.common.enums.UserStatus;
import java.time.LocalDateTime;

/**
 * Entity gốc (abstract) — ánh xạ bảng `users`.
 * KHÔNG chứa logic nghiệp vụ (CODE_PRINCIPLES NAM-04, README 2.1 #14).
 */
public abstract class UserEntity {
    private String userId;
    private String email;
    private String passwordHash;
    private String fullName;
    private String phone;
    private String logoUrl;
    private boolean loggedIn;
    private UserStatus status;
    private LocalDateTime createdAt;

    // ── Getters / Setters ────────────────────────────────────────────────────
    public String getUserId()          { return userId; }
    public void setUserId(String v)    { this.userId = v; }
    public String getEmail()           { return email; }
    public void setEmail(String v)     { this.email = v; }
    public String getPasswordHash()    { return passwordHash; }
    public void setPasswordHash(String v) { this.passwordHash = v; }
    public String getFullName()        { return fullName; }
    public void setFullName(String v)  { this.fullName = v; }
    public String getPhone()           { return phone; }
    public void setPhone(String v)     { this.phone = v; }
    public String getLogoUrl()         { return logoUrl; }
    public void setLogoUrl(String v)   { this.logoUrl = v; }
    public boolean isLoggedIn()        { return loggedIn; }
    public void setLoggedIn(boolean v) { this.loggedIn = v; }
    public UserStatus getStatus()      { return status; }
    public void setStatus(UserStatus v){ this.status = v; }
    public LocalDateTime getCreatedAt(){ return createdAt; }
    public void setCreatedAt(LocalDateTime v) { this.createdAt = v; }
}
