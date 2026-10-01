package com.example.webchicken.modules.identity.model.entity;

import java.time.LocalDateTime;

/** Ánh xạ bảng `sellers`. Kế thừa UserEntity. */
public class SellerEntity extends UserEntity {
    private String taxCode;
    private LocalDateTime approvedAt;

    public String getTaxCode()              { return taxCode; }
    public void setTaxCode(String v)        { this.taxCode = v; }
    public LocalDateTime getApprovedAt()    { return approvedAt; }
    public void setApprovedAt(LocalDateTime v) { this.approvedAt = v; }
}
