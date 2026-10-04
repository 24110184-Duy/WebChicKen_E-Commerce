package com.example.webchicken.modules.order.model.entity;

import com.example.webchicken.common.enums.OrderStatus;
import com.example.webchicken.common.enums.PaymentStatus;
import com.example.webchicken.modules.order.model.enums.PaymentMethod;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
public class OrderEntity {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "order_code", length = 50, nullable = false, unique = true)
    private String orderCode;

    @Column(name = "order_group_id", length = 36, nullable = false)
    private String orderGroupId;

    @Column(name = "customer_id", length = 36, nullable = false)
    private String customerId;

    @Column(name = "store_id", length = 36)
    private String storeId;

    @Column(name = "order_date", nullable = false)
    private LocalDateTime orderDate = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private OrderStatus status = OrderStatus.PENDING;

    @Column(name = "total_amount_minor", nullable = false)
    private long totalAmountMinor = 0;

    @Column(name = "shipping_fee_minor", nullable = false)
    private long shippingFeeMinor = 0;

    @Column(name = "discount_amount_minor", nullable = false)
    private long discountAmountMinor = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false)
    private PaymentStatus paymentStatus = PaymentStatus.UNPAID;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false)
    private PaymentMethod paymentMethod = PaymentMethod.COD;

    @Column(name = "voucher_id", length = 36)
    private String voucherId;

    @Column(name = "recipient_name", length = 100)
    private String recipientName;

    @Column(name = "recipient_phone", length = 20)
    private String recipientPhone;

    @Column(name = "shipping_address", columnDefinition = "TEXT")
    private String shippingAddress;

    @Column(name = "note", length = 500)
    private String note;

    public OrderEntity() {
    }

    public OrderEntity(String id, String orderCode, String orderGroupId, String customerId, String storeId,
                       long totalAmountMinor, long shippingFeeMinor, long discountAmountMinor,
                       PaymentMethod paymentMethod, String recipientName, String recipientPhone,
                       String shippingAddress, String note) {
        this.id = id;
        this.orderCode = orderCode;
        this.orderGroupId = orderGroupId;
        this.customerId = customerId;
        this.storeId = storeId;
        this.totalAmountMinor = totalAmountMinor;
        this.shippingFeeMinor = shippingFeeMinor;
        this.discountAmountMinor = discountAmountMinor;
        this.paymentMethod = paymentMethod;
        this.recipientName = recipientName;
        this.recipientPhone = recipientPhone;
        this.shippingAddress = shippingAddress;
        this.note = note;
        this.orderDate = LocalDateTime.now();
        this.status = OrderStatus.PENDING;
        this.paymentStatus = PaymentStatus.UNPAID;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getOrderCode() {
        return orderCode;
    }

    public void setOrderCode(String orderCode) {
        this.orderCode = orderCode;
    }

    public String getOrderGroupId() {
        return orderGroupId;
    }

    public void setOrderGroupId(String orderGroupId) {
        this.orderGroupId = orderGroupId;
    }

    public String getCustomerId() {
        return customerId;
    }

    public void setCustomerId(String customerId) {
        this.customerId = customerId;
    }

    public String getStoreId() {
        return storeId;
    }

    public void setStoreId(String storeId) {
        this.storeId = storeId;
    }

    public LocalDateTime getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(LocalDateTime orderDate) {
        this.orderDate = orderDate;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public long getTotalAmountMinor() {
        return totalAmountMinor;
    }

    public void setTotalAmountMinor(long totalAmountMinor) {
        this.totalAmountMinor = totalAmountMinor;
    }

    public long getShippingFeeMinor() {
        return shippingFeeMinor;
    }

    public void setShippingFeeMinor(long shippingFeeMinor) {
        this.shippingFeeMinor = shippingFeeMinor;
    }

    public long getDiscountAmountMinor() {
        return discountAmountMinor;
    }

    public void setDiscountAmountMinor(long discountAmountMinor) {
        this.discountAmountMinor = discountAmountMinor;
    }

    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(PaymentStatus paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getVoucherId() {
        return voucherId;
    }

    public void setVoucherId(String voucherId) {
        this.voucherId = voucherId;
    }

    public String getRecipientName() {
        return recipientName;
    }

    public void setRecipientName(String recipientName) {
        this.recipientName = recipientName;
    }

    public String getRecipientPhone() {
        return recipientPhone;
    }

    public void setRecipientPhone(String recipientPhone) {
        this.recipientPhone = recipientPhone;
    }

    public String getShippingAddress() {
        return shippingAddress;
    }

    public void setShippingAddress(String shippingAddress) {
        this.shippingAddress = shippingAddress;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
