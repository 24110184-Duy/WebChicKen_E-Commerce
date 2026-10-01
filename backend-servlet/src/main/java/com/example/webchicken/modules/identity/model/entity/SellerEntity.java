package com.example.webchicken.modules.identity.model.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Ánh xạ bảng {@code sellers}.
 * Kế thừa {@link UserEntity} theo chiến lược JOINED.
 */
@Entity
@Table(name = "sellers")
@PrimaryKeyJoinColumn(name = "id")
public class SellerEntity extends UserEntity {

    @Column(name = "tax_code", length = 50)
    private String taxCode;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    public String getTaxCode()                  { return taxCode; }
    public void setTaxCode(String v)            { this.taxCode = v; }
    public LocalDateTime getApprovedAt()        { return approvedAt; }
    public void setApprovedAt(LocalDateTime v)  { this.approvedAt = v; }
}
