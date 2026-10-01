package com.example.webchicken.modules.identity.model.entity;

import com.example.webchicken.common.enums.LoyaltyTier;

/** Ánh xạ bảng `customers`. Kế thừa UserEntity. */
public class CustomerEntity extends UserEntity {
    private LoyaltyTier tier;
    private int loyaltyPoint;

    public LoyaltyTier getTier()         { return tier; }
    public void setTier(LoyaltyTier v)   { this.tier = v; }
    public int getLoyaltyPoint()         { return loyaltyPoint; }
    public void setLoyaltyPoint(int v)   { this.loyaltyPoint = v; }
}
