package com.example.webchicken.modules.shop.model.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Ánh xạ bảng {@code seller_applications}.
 * Quản lý đơn xin trở thành Người bán (Seller) của Người mua (Customer).
 */
@Entity
@Table(name = "seller_applications")
public class SellerApplicationEntity {

    @Id
    @Column(name = "id", length = 36, nullable = false, updatable = false)
    private String id;

    @Column(name = "user_id", length = 36, nullable = false)
    private String userId;

    @Column(name = "shop_name", length = 100, nullable = false)
    private String shopName;

    @Column(name = "document_url", length = 500)
    private String documentUrl;

    @Column(name = "status", length = 30, nullable = false)
    private String status; // PENDING, APPROVED, REJECTED

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "admin_response_id", length = 36)
    private String adminResponseId;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "owner_name", length = 100)
    private String ownerName;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "farm_location", length = 500)
    private String farmLocation;

    @Column(name = "farm_type", length = 100)
    private String farmType;

    @Column(name = "tax_code", length = 50)
    private String taxCode;

    @Column(name = "certificate_type", length = 100)
    private String certificateType;

    @Column(name = "certificate_number", length = 100)
    private String certificateNumber;

    @Column(name = "certificate_expiry", length = 50)
    private String certificateExpiry;

    @Column(name = "daily_capacity", length = 100)
    private String dailyCapacity;

    public SellerApplicationEntity() {}

    // ── Getters / Setters ────────────────────────────────────────────────────
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getShopName() { return shopName; }
    public void setShopName(String shopName) { this.shopName = shopName; }

    public String getDocumentUrl() { return documentUrl; }
    public void setDocumentUrl(String documentUrl) { this.documentUrl = documentUrl; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public String getAdminResponseId() { return adminResponseId; }
    public void setAdminResponseId(String adminResponseId) { this.adminResponseId = adminResponseId; }

    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }

    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }

    public String getOwnerName() { return ownerName; }
    public void setOwnerName(String ownerName) { this.ownerName = ownerName; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFarmLocation() { return farmLocation; }
    public void setFarmLocation(String farmLocation) { this.farmLocation = farmLocation; }

    public String getFarmType() { return farmType; }
    public void setFarmType(String farmType) { this.farmType = farmType; }

    public String getTaxCode() { return taxCode; }
    public void setTaxCode(String taxCode) { this.taxCode = taxCode; }

    public String getCertificateType() { return certificateType; }
    public void setCertificateType(String certificateType) { this.certificateType = certificateType; }

    public String getCertificateNumber() { return certificateNumber; }
    public void setCertificateNumber(String certificateNumber) { this.certificateNumber = certificateNumber; }

    public String getCertificateExpiry() { return certificateExpiry; }
    public void setCertificateExpiry(String certificateExpiry) { this.certificateExpiry = certificateExpiry; }

    public String getDailyCapacity() { return dailyCapacity; }
    public void setDailyCapacity(String dailyCapacity) { this.dailyCapacity = dailyCapacity; }
}
