package com.example.webchicken.modules.identity.model.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/** Ánh xạ bảng {@code addresses}. */
@Entity
@Table(name = "addresses")
public class AddressEntity {

    @Id
    @Column(name = "id", length = 36, nullable = false, updatable = false)
    private String addressId;

    @Column(name = "user_id", length = 36, nullable = false, updatable = false)
    private String userId;

    @Column(name = "recipient_name", length = 100, nullable = false)
    private String recipientName;

    @Column(name = "phone", length = 20, nullable = false)
    private String phone;

    @Column(name = "address_line1", length = 255, nullable = false)
    private String addressLine1;

    @Column(name = "district", length = 100, nullable = false)
    private String district;

    @Column(name = "city", length = 100, nullable = false)
    private String city;

    @Column(name = "is_default", nullable = false)
    private boolean isDefault;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public String getAddressId()            { return addressId; }
    public void setAddressId(String v)      { this.addressId = v; }
    public String getUserId()               { return userId; }
    public void setUserId(String v)         { this.userId = v; }
    public String getRecipientName()        { return recipientName; }
    public void setRecipientName(String v)  { this.recipientName = v; }
    public String getPhone()                { return phone; }
    public void setPhone(String v)          { this.phone = v; }
    public String getAddressLine1()         { return addressLine1; }
    public void setAddressLine1(String v)   { this.addressLine1 = v; }
    public String getDistrict()             { return district; }
    public void setDistrict(String v)       { this.district = v; }
    public String getCity()                 { return city; }
    public void setCity(String v)           { this.city = v; }
    public boolean isDefault()              { return isDefault; }
    public void setDefault(boolean v)       { this.isDefault = v; }
    public LocalDateTime getCreatedAt()     { return createdAt; }
    public void setCreatedAt(LocalDateTime v){ this.createdAt = v; }
}
