package com.example.webchicken.modules.promotion.model.entity;

import com.example.webchicken.modules.promotion.model.enums.VoucherType;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vouchers")
public class VoucherEntity {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "code", length = 50, nullable = false, unique = true)
    private String code;

    @Column(name = "title", length = 255)
    private String title;

    @Column(name = "description", length = 255)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private VoucherType type;

    @Column(name = "discount_value_minor", nullable = false)
    private long discountValueMinor;

    @Column(name = "min_order_value_minor", nullable = false)
    private long minOrderValueMinor;

    @Column(name = "max_discount_amount_minor", nullable = false)
    private long maxDiscountAmountMinor;

    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDateTime endDate;

    @Column(name = "store_id", length = 36)
    private String storeId;

    @Column(name = "usage_limit", nullable = false)
    private int usageLimit = 1000;

    @Column(name = "used_count", nullable = false)
    private int usedCount = 0;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    public VoucherEntity() {
    }

    public VoucherEntity(String id, String code, String title, VoucherType type,
                         long discountValueMinor, long minOrderValueMinor, long maxDiscountAmountMinor,
                         LocalDateTime startDate, LocalDateTime endDate, String storeId) {
        this.id = id;
        this.code = code;
        this.title = title;
        this.type = type;
        this.discountValueMinor = discountValueMinor;
        this.minOrderValueMinor = minOrderValueMinor;
        this.maxDiscountAmountMinor = maxDiscountAmountMinor;
        this.startDate = startDate;
        this.endDate = endDate;
        this.storeId = storeId;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public VoucherType getType() {
        return type;
    }

    public void setType(VoucherType type) {
        this.type = type;
    }

    public long getDiscountValueMinor() {
        return discountValueMinor;
    }

    public void setDiscountValueMinor(long discountValueMinor) {
        this.discountValueMinor = discountValueMinor;
    }

    public long getMinOrderValueMinor() {
        return minOrderValueMinor;
    }

    public void setMinOrderValueMinor(long minOrderValueMinor) {
        this.minOrderValueMinor = minOrderValueMinor;
    }

    public long getMaxDiscountAmountMinor() {
        return maxDiscountAmountMinor;
    }

    public void setMaxDiscountAmountMinor(long maxDiscountAmountMinor) {
        this.maxDiscountAmountMinor = maxDiscountAmountMinor;
    }

    public LocalDateTime getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDateTime startDate) {
        this.startDate = startDate;
    }

    public LocalDateTime getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDateTime endDate) {
        this.endDate = endDate;
    }

    public String getStoreId() {
        return storeId;
    }

    public void setStoreId(String storeId) {
        this.storeId = storeId;
    }

    public int getUsageLimit() {
        return usageLimit;
    }

    public void setUsageLimit(int usageLimit) {
        this.usageLimit = usageLimit;
    }

    public int getUsedCount() {
        return usedCount;
    }

    public void setUsedCount(int usedCount) {
        this.usedCount = usedCount;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }
}
