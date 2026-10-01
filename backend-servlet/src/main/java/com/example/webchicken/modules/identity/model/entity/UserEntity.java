package com.example.webchicken.modules.identity.model.entity;

import com.example.webchicken.common.enums.UserStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity gốc (abstract) — ánh xạ bảng {@code users} dùng TABLE_PER_CLASS inheritance.
 * KHÔNG chứa logic nghiệp vụ (CODE_PRINCIPLES NAM-04, README 2.1 #14).
 */
@Entity
@Table(name = "users")
@Inheritance(strategy = InheritanceType.JOINED)
public abstract class UserEntity {

    @Id
    @Column(name = "id", length = 36, nullable = false, updatable = false)
    private String userId;

    @Column(name = "email", length = 255, nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", length = 255, nullable = false)
    private String passwordHash;

    @Column(name = "full_name", length = 100, nullable = false)
    private String fullName;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "logged_in", nullable = false)
    private boolean loggedIn;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private UserStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // ── Getters / Setters ────────────────────────────────────────────────────
    public String getUserId()               { return userId; }
    public void setUserId(String v)         { this.userId = v; }
    public String getEmail()                { return email; }
    public void setEmail(String v)          { this.email = v; }
    public String getPasswordHash()         { return passwordHash; }
    public void setPasswordHash(String v)   { this.passwordHash = v; }
    public String getFullName()             { return fullName; }
    public void setFullName(String v)       { this.fullName = v; }
    public String getPhone()                { return phone; }
    public void setPhone(String v)          { this.phone = v; }
    public String getLogoUrl()              { return logoUrl; }
    public void setLogoUrl(String v)        { this.logoUrl = v; }
    public boolean isLoggedIn()             { return loggedIn; }
    public void setLoggedIn(boolean v)      { this.loggedIn = v; }
    public UserStatus getStatus()           { return status; }
    public void setStatus(UserStatus v)     { this.status = v; }
    public LocalDateTime getCreatedAt()     { return createdAt; }
    public void setCreatedAt(LocalDateTime v){ this.createdAt = v; }
    public LocalDateTime getUpdatedAt()     { return updatedAt; }
    public void setUpdatedAt(LocalDateTime v){ this.updatedAt = v; }
}
