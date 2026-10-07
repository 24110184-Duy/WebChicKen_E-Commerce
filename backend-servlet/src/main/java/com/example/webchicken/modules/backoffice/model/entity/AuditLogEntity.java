package com.example.webchicken.modules.backoffice.model.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Ánh xạ bảng {@code audit_logs}.
 * Ghi nhận nhật ký kiểm toán bất biến các thao tác nhạy cảm của Admin (TASK-67).
 */
@Entity
@Table(name = "audit_logs")
public class AuditLogEntity {

    @Id
    @Column(name = "id", length = 36, nullable = false, updatable = false)
    private String id;

    @Column(name = "admin_id", length = 36, nullable = false, updatable = false)
    private String adminId;

    @Column(name = "action", length = 100, nullable = false, updatable = false)
    private String action;

    @Column(name = "target_type", length = 100, updatable = false)
    private String targetType;

    @Column(name = "target_id", length = 36, updatable = false)
    private String targetId;

    @Column(name = "detail", columnDefinition = "TEXT", updatable = false)
    private String detail;

    @Column(name = "ip_address", length = 45, updatable = false)
    private String ipAddress;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public AuditLogEntity() {
    }

    public AuditLogEntity(String id, String adminId, String action, String targetType, String targetId, String detail, String ipAddress, LocalDateTime createdAt) {
        this.id = id;
        this.adminId = adminId;
        this.action = action;
        this.targetType = targetType;
        this.targetId = targetId;
        this.detail = detail;
        this.ipAddress = ipAddress;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getAdminId() { return adminId; }
    public void setAdminId(String adminId) { this.adminId = adminId; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getTargetType() { return targetType; }
    public void setTargetType(String targetType) { this.targetType = targetType; }

    public String getTargetId() { return targetId; }
    public void setTargetId(String targetId) { this.targetId = targetId; }

    public String getDetail() { return detail; }
    public void setDetail(String detail) { this.detail = detail; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
