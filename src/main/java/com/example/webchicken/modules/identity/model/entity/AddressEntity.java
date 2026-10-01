package com.example.webchicken.modules.identity.model.entity;

/** Ánh xạ bảng `addresses`. */
public class AddressEntity {
    private String addressId;
    private String userId;
    private String recipientName;
    private String phone;
    private String addressLine1;
    private String district;
    private String city;
    private boolean isDefault;

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
}
