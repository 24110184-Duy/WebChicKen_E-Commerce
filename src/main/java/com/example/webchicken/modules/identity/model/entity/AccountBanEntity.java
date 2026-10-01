package com.example.webchicken.modules.identity.model.entity;

import java.time.LocalDateTime;

/** Ánh xạ bảng `account_bans`. */
public class AccountBanEntity {
    private String banId;
    private String userId;
    private String description;
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
