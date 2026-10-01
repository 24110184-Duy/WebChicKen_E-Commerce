package com.example.webchicken.modules.identity.model.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/** Ánh xạ bảng {@code account_bans}. */
@Entity
@Table(name = "account_bans")
public class AccountBanEntity {

    @Id
    @Column(name = "id", length = 36, nullable = false, updatable = false)
    private String banId;

    @Column(name = "user_id", length = 36, nullable = false, updatable = false)
    private String userId;

    @Column(name = "description", length = 500, nullable = false)
    private String description;

    @Column(name = "banned_at", nullable = false, updatable = false)
    private LocalDateTime bannedAt;

    public String getBanId()                { return banId; }
    public void setBanId(String v)          { this.banId = v; }
    public String getUserId()               { return userId; }
    public void setUserId(String v)         { this.userId = v; }
    public String getDescription()          { return description; }
    public void setDescription(String v)    { this.description = v; }
    public LocalDateTime getBannedAt()      { return bannedAt; }
    public void setBannedAt(LocalDateTime v){ this.bannedAt = v; }
}
