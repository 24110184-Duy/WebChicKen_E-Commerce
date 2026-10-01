package com.example.webchicken.modules.identity.model.entity;

import com.example.webchicken.common.enums.LoyaltyTier;
import jakarta.persistence.*;

/**
 * Ánh xạ bảng {@code customers}.
 * Kế thừa {@link UserEntity} theo chiến lược JOINED (primary key tham chiếu {@code users.id}).
 */
@Entity
@Table(name = "customers")
@PrimaryKeyJoinColumn(name = "id")
public class CustomerEntity extends UserEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "tier", nullable = false, length = 20)
    private LoyaltyTier tier = LoyaltyTier.STANDARD;

    @Column(name = "loyalty_point", nullable = false)
    private int loyaltyPoint;

    public LoyaltyTier getTier()         { return tier; }
    public void setTier(LoyaltyTier v)   { this.tier = v; }
    public int getLoyaltyPoint()         { return loyaltyPoint; }
    public void setLoyaltyPoint(int v)   { this.loyaltyPoint = v; }
}
