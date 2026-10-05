package com.example.webchicken.modules.payment.service.impl;

import com.example.webchicken.common.enums.OrderStatus;
import com.example.webchicken.common.enums.PaymentStatus;
import com.example.webchicken.common.exception.ConflictException;
import com.example.webchicken.common.exception.NotFoundException;
import com.example.webchicken.common.exception.ValidationException;
import com.example.webchicken.infrastructure.payment.VNPayGateway;
import com.example.webchicken.modules.order.dao.OrderDAO;
import com.example.webchicken.modules.order.model.entity.OrderEntity;
import com.example.webchicken.modules.payment.dao.PaymentDAO;
import com.example.webchicken.modules.payment.gateway.PaymentGateway;
import com.example.webchicken.modules.payment.model.dto.response.PaymentMethodResponse;
import com.example.webchicken.modules.payment.model.dto.response.PaymentResponse;
import com.example.webchicken.modules.payment.model.dto.response.PaymentUrlResponse;
import com.example.webchicken.modules.payment.model.dto.response.VNPayIpnResponse;
import com.example.webchicken.modules.payment.model.entity.PaymentEntity;
import com.example.webchicken.modules.payment.service.PaymentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Triển khai nghiệp vụ Payment Service: COD và VNPay Gateway (TASK-50 & TASK-51).
 */
public class PaymentServiceImpl implements PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentServiceImpl.class);

    private final PaymentDAO paymentDAO;
    private final OrderDAO orderDAO;
    private final PaymentGateway paymentGateway;

    public PaymentServiceImpl(PaymentDAO paymentDAO, OrderDAO orderDAO) {
        this(paymentDAO, orderDAO, new VNPayGateway());
    }

    public PaymentServiceImpl(PaymentDAO paymentDAO, OrderDAO orderDAO, PaymentGateway paymentGateway) {
        this.paymentDAO = Objects.requireNonNull(paymentDAO, "paymentDAO must not be null");
        this.orderDAO = Objects.requireNonNull(orderDAO, "orderDAO must not be null");
        this.paymentGateway = Objects.requireNonNull(paymentGateway, "paymentGateway must not be null");
    }

    @Override
    public PaymentResponse createCodPayment(String orderId, long amountMinor) {
        if (orderId == null || orderId.isBlank()) {
            throw new ValidationException("orderId is required");
        }
        if (amountMinor < 0) {
            throw new ValidationException("amountMinor must not be negative");
        }

        // Generate reconciliation ref: COD-YYYYMMDD-XXXX
        String datePrefix = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int randomSuffix = ThreadLocalRandom.current().nextInt(1000, 9999);
        String transactionRef = "COD-" + datePrefix + "-" + randomSuffix;

        PaymentEntity payment = new PaymentEntity(
                UUID.randomUUID().toString(),
                orderId,
                amountMinor,
                PaymentStatus.UNPAID,
                transactionRef,
                null
        );

        paymentDAO.save(payment);
        log.info("Created COD payment record: id={}, orderId={}, amountMinor={}, ref={}",
                payment.getId(), orderId, amountMinor, transactionRef);

        return PaymentResponse.fromEntity(payment);
    }

    @Override
    public PaymentResponse getPaymentByOrderId(String orderId) {
        PaymentEntity payment = paymentDAO.findByOrderId(orderId)
                .orElseThrow(() -> new NotFoundException("Payment for order", orderId));
        return PaymentResponse.fromEntity(payment);
    }

    @Override
    public PaymentResponse confirmCodPayment(String orderId) {
        PaymentEntity payment = paymentDAO.findByOrderId(orderId)
                .orElseThrow(() -> new NotFoundException("Payment for order", orderId));

        // Idempotency: return immediately if already PAID
        if (payment.getStatus() == PaymentStatus.PAID) {
            return PaymentResponse.fromEntity(payment);
        }

        if (payment.getStatus() == PaymentStatus.FAILED || payment.getStatus() == PaymentStatus.REFUNDED) {
            throw new ConflictException("Cannot confirm payment in status: " + payment.getStatus());
        }

        // Update payment status to PAID
        payment.setStatus(PaymentStatus.PAID);
        payment.setPaidAt(LocalDateTime.now());
        paymentDAO.update(payment);

        // Sync order payment status to PAID
        orderDAO.updatePaymentStatus(orderId, PaymentStatus.PAID);

        log.info("Confirmed COD payment successfully: orderId={}, amountMinor={}", orderId, payment.getAmountMinor());
        return PaymentResponse.fromEntity(payment);
    }

    @Override
    public PaymentUrlResponse createVNPayPaymentUrl(String orderCode, String ipAddress) {
        if (orderCode == null || orderCode.isBlank()) {
            throw new ValidationException("orderCode is required");
        }

        // 1. Retrieve order securely from database (SEC-12)
        OrderEntity order = orderDAO.findByOrderCode(orderCode.trim())
                .orElseThrow(() -> new NotFoundException("Order", orderCode));

        // 2. Validate current state
        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            throw new ConflictException("This order has already been paid.");
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new ConflictException("The order has been cancelled and cannot be paid.");
        }

        long amountMinor = order.getTotalAmountMinor();

        // 3. Delegate URL creation to PaymentGateway
        String paymentUrl = paymentGateway.createPaymentUrl(
                order.getOrderCode(),
                amountMinor,
                "Payment for order " + order.getOrderCode(),
                ipAddress
        );

        // 4. Save or update PaymentEntity as UNPAID
        Optional<PaymentEntity> existingPayment = paymentDAO.findByOrderId(order.getId());
        if (existingPayment.isPresent()) {
            PaymentEntity payment = existingPayment.get();
            payment.setTransactionRef(order.getOrderCode());
            payment.setAmountMinor(amountMinor);
            paymentDAO.update(payment);
        } else {
            PaymentEntity payment = new PaymentEntity(
                    UUID.randomUUID().toString(),
                    order.getId(),
                    amountMinor,
                    PaymentStatus.UNPAID,
                    order.getOrderCode(),
                    null
            );
            paymentDAO.save(payment);
        }

        log.info("Generated VNPay payment URL for order {}: amountMinor={}", orderCode, amountMinor);
        return new PaymentUrlResponse(orderCode, amountMinor, paymentUrl);
    }

    @Override
    public VNPayIpnResponse processVNPayIpn(Map<String, String> params) {
        if (params == null || params.isEmpty()) {
            return VNPayIpnResponse.unknownError("Empty payload");
        }

        // 1. Verify Checksum signature (SEC-05)
        boolean validSignature = paymentGateway.verifySignature(params);
        if (!validSignature) {
            log.warn("VNPay IPN signature verification failed for params: {}", params);
            return VNPayIpnResponse.invalidChecksum();
        }

        // 2. Validate order exists
        String orderCode = params.get("vnp_TxnRef");
        if (orderCode == null || orderCode.isBlank()) {
            return VNPayIpnResponse.orderNotFound();
        }

        Optional<OrderEntity> orderOpt = orderDAO.findByOrderCode(orderCode.trim());
        if (orderOpt.isEmpty()) {
            log.warn("VNPay IPN order not found: {}", orderCode);
            return VNPayIpnResponse.orderNotFound();
        }
        OrderEntity order = orderOpt.get();

        // 3. Validate Amount (amount in minor units * 100)
        String vnpAmountStr = params.get("vnp_Amount");
        if (vnpAmountStr == null || vnpAmountStr.isBlank()) {
            return VNPayIpnResponse.invalidAmount();
        }
        try {
            long vnpAmount = Long.parseLong(vnpAmountStr);
            long expectedAmount = order.getTotalAmountMinor() * 100;
            if (vnpAmount != expectedAmount) {
                log.warn("VNPay IPN invalid amount. Expected: {}, Received: {}", expectedAmount, vnpAmount);
                return VNPayIpnResponse.invalidAmount();
            }
        } catch (NumberFormatException e) {
            return VNPayIpnResponse.invalidAmount();
        }

        // 4. Idempotency Check (SEC-08)
        Optional<PaymentEntity> paymentOpt = paymentDAO.findByOrderId(order.getId());
        if (order.getPaymentStatus() == PaymentStatus.PAID
                || (paymentOpt.isPresent() && paymentOpt.get().getStatus() == PaymentStatus.PAID)) {
            log.info("VNPay IPN order already confirmed: {}", orderCode);
            return VNPayIpnResponse.alreadyConfirmed();
        }

        // 5. Update Status based on vnp_ResponseCode
        String responseCode = params.get("vnp_ResponseCode");
        String transactionStatus = params.get("vnp_TransactionStatus");
        String transactionNo = params.get("vnp_TransactionNo");

        boolean isSuccessful = "00".equals(responseCode) && ("00".equals(transactionStatus) || transactionStatus == null);

        if (isSuccessful) {
            // Update or create Payment Record
            if (paymentOpt.isPresent()) {
                PaymentEntity payment = paymentOpt.get();
                payment.setStatus(PaymentStatus.PAID);
                payment.setTransactionRef(transactionNo != null ? transactionNo : orderCode);
                payment.setPaidAt(LocalDateTime.now());
                paymentDAO.update(payment);
            } else {
                PaymentEntity payment = new PaymentEntity(
                        UUID.randomUUID().toString(),
                        order.getId(),
                        order.getTotalAmountMinor(),
                        PaymentStatus.PAID,
                        transactionNo != null ? transactionNo : orderCode,
                        LocalDateTime.now()
                );
                paymentDAO.save(payment);
            }

            // Synchronize Order status
            orderDAO.updatePaymentStatus(order.getId(), PaymentStatus.PAID);
            if (order.getStatus() == OrderStatus.PENDING) {
                orderDAO.updateStatus(order.getId(), OrderStatus.CONFIRMED);
            }
            log.info("VNPay IPN confirmed order {} as PAID", orderCode);
        } else {
            // Mark Payment as FAILED
            if (paymentOpt.isPresent()) {
                PaymentEntity payment = paymentOpt.get();
                payment.setStatus(PaymentStatus.FAILED);
                paymentDAO.update(payment);
            }
            orderDAO.updatePaymentStatus(order.getId(), PaymentStatus.FAILED);
            log.warn("VNPay IPN marked order {} payment as FAILED (code: {})", orderCode, responseCode);
        }

        return VNPayIpnResponse.success();
    }

    @Override
    public List<PaymentMethodResponse> getAvailablePaymentMethods() {
        return List.of(
                new PaymentMethodResponse("COD", "Cash On Delivery (COD)", "Pay with cash upon delivery", true),
                new PaymentMethodResponse("VNPAY", "VNPAY-QR Gateway", "Pay via ATM card, QR Code or VNPAY e-wallet", false),
                new PaymentMethodResponse("BANKING", "Bank Transfer", "Direct bank transfer via VietQR", false)
        );
    }
}
