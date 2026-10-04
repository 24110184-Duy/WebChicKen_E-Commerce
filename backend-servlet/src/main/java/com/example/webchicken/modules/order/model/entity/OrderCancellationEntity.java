package com.example.webchicken.modules.order.model.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "order_cancellations")
public class OrderCancellationEntity {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "order_id", length = 36, nullable = false)
    private String orderId;

    @Column(name = "cancel_at", nullable = false)
    private LocalDateTime cancelAt = LocalDateTime.now();

    @Column(name = "reason", length = 500, nullable = false)
    private String reason;

    @Column(name = "cancelled_by", length = 50, nullable = false)
    private String cancelledBy = "CUSTOMER";

    public OrderCancellationEntity() {
    }

    public OrderCancellationEntity(String id, String orderId, String reason, String cancelledBy) {
        this.id = id;
        this.orderId = orderId;
        this.reason = reason;
        this.cancelledBy = cancelledBy;
        this.cancelAt = LocalDateTime.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public LocalDateTime getCancelAt() {
        return cancelAt;
    }

    public void setCancelAt(LocalDateTime cancelAt) {
        this.cancelAt = cancelAt;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getCancelledBy() {
        return cancelledBy;
    }

    public void setCancelledBy(String cancelledBy) {
        this.cancelledBy = cancelledBy;
    }
}
