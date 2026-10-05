package com.example.webchicken.modules.payment.model.entity;

import com.example.webchicken.common.enums.PaymentStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Ánh xạ bảng {@code payments}.
 * Đại diện cho một giao dịch thanh toán của đơn hàng.
 */
@Entity
@Table(name = "payments")
public class PaymentEntity {

    @Id
    @Column(name = "id", length = 36, nullable = false, updatable = false)
    private String id;

    @Column(name = "order_id", length = 36, nullable = false)
    private String orderId;

    @Column(name = "amount_minor", nullable = false)
    private long amountMinor;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private PaymentStatus status = PaymentStatus.UNPAID;

    @Column(name = "transaction_ref", length = 255)
    private String transactionRef;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    public PaymentEntity() {}

    public PaymentEntity(String id, String orderId, long amountMinor, 
                         PaymentStatus status, String transactionRef, LocalDateTime paidAt) {
        this.id = id;
        this.orderId = orderId;
        this.amountMinor = amountMinor;
        this.status = status != null ? status : PaymentStatus.UNPAID;
        this.transactionRef = transactionRef;
        this.paidAt = paidAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public long getAmountMinor() { return amountMinor; }
    public void setAmountMinor(long amountMinor) { this.amountMinor = amountMinor; }

    public PaymentStatus getStatus() { return status; }
    public void setStatus(PaymentStatus status) { this.status = status; }

    public String getTransactionRef() { return transactionRef; }
    public void setTransactionRef(String transactionRef) { this.transactionRef = transactionRef; }

    public LocalDateTime getPaidAt() { return paidAt; }
    public void setPaidAt(LocalDateTime paidAt) { this.paidAt = paidAt; }
}
