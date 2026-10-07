package com.example.webchicken.modules.shop.model.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Thực thể lưu trữ phản hồi, thắc mắc và khiếu nại từ Nhà bán gửi lên Ban Quản Trị (TASK-69).
 */
@Entity
@Table(name = "feedback_to_admins")
public class FeedbackEntity {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "user_id", length = 36, nullable = false)
    private String userId;

    @Column(name = "type", length = 50, nullable = false)
    private String type; // COMPLAINT, INQUIRY, SUGGESTION, TECHNICAL, PAYMENT

    @Column(name = "subject", length = 255, nullable = false)
    private String subject;

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "status", length = 50, nullable = false)
    private String status = "PENDING"; // PENDING, PROCESSING, RESOLVED, REJECTED

    @Column(name = "admin_response", columnDefinition = "TEXT")
    private String adminResponse;

    @Column(name = "resolved_by", length = 50)
    private String resolvedBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    public FeedbackEntity() {
    }

    public FeedbackEntity(String id, String userId, String type, String subject, String content, String imageUrl) {
        this.id = id;
        this.userId = userId;
        this.type = type;
        this.subject = subject;
        this.content = content;
        this.imageUrl = imageUrl;
        this.status = "PENDING";
        this.createdAt = LocalDateTime.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getAdminResponse() {
        return adminResponse;
    }

    public void setAdminResponse(String adminResponse) {
        this.adminResponse = adminResponse;
    }

    public String getResolvedBy() {
        return resolvedBy;
    }

    public void setResolvedBy(String resolvedBy) {
        this.resolvedBy = resolvedBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(LocalDateTime resolvedAt) {
        this.resolvedAt = resolvedAt;
    }
}
