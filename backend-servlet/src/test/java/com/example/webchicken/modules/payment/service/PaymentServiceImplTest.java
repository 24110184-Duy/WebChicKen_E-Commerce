package com.example.webchicken.modules.payment.service;

import com.example.webchicken.common.enums.OrderStatus;
import com.example.webchicken.common.enums.PaymentStatus;
import com.example.webchicken.modules.order.dao.OrderDAO;
import com.example.webchicken.modules.order.model.entity.OrderEntity;
import com.example.webchicken.modules.payment.dao.PaymentDAO;
import com.example.webchicken.modules.payment.gateway.PaymentGateway;
import com.example.webchicken.modules.payment.model.dto.response.VNPayIpnResponse;
import com.example.webchicken.modules.payment.model.entity.PaymentEntity;
import com.example.webchicken.modules.payment.service.impl.PaymentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

public class PaymentServiceImplTest {

    private PaymentDAO paymentDAO;
    private OrderDAO orderDAO;
    private PaymentGateway paymentGateway;
    private PaymentServiceImpl paymentService;

    @BeforeEach
    void setUp() {
        paymentDAO = mock(PaymentDAO.class);
        orderDAO = mock(OrderDAO.class);
        paymentGateway = mock(PaymentGateway.class);
        paymentService = new PaymentServiceImpl(paymentDAO, orderDAO, paymentGateway);
    }

    @Test
    void testProcessVNPayIpn_InvalidChecksum_ReturnsCode97() {
        Map<String, String> params = new HashMap<>();
        params.put("vnp_TxnRef", "ORD-20261004-123456");
        params.put("vnp_SecureHash", "fake_hash");

        when(paymentGateway.verifySignature(params)).thenReturn(false);

        VNPayIpnResponse response = paymentService.processVNPayIpn(params);

        assertNotNull(response);
        assertEquals("97", response.rspCode());
        assertEquals("Invalid Checksum", response.message());
        verify(orderDAO, never()).findByOrderCode(any());
    }

    @Test
    void testProcessVNPayIpn_OrderNotFound_ReturnsCode01() {
        Map<String, String> params = new HashMap<>();
        params.put("vnp_TxnRef", "ORD-NONEXISTENT");
        params.put("vnp_SecureHash", "valid_hash");

        when(paymentGateway.verifySignature(params)).thenReturn(true);
        when(orderDAO.findByOrderCode("ORD-NONEXISTENT")).thenReturn(Optional.empty());

        VNPayIpnResponse response = paymentService.processVNPayIpn(params);

        assertNotNull(response);
        assertEquals("01", response.rspCode());
        assertEquals("Order not found", response.message());
    }

    @Test
    void testProcessVNPayIpn_InvalidAmount_ReturnsCode04() {
        Map<String, String> params = new HashMap<>();
        params.put("vnp_TxnRef", "ORD-1001");
        params.put("vnp_Amount", "10000000"); // 100,000 VND (in VNPay *100 minor unit)

        OrderEntity mockOrder = new OrderEntity();
        mockOrder.setId("ord-uuid-1");
        mockOrder.setOrderCode("ORD-1001");
        mockOrder.setTotalAmountMinor(200000L); // Expected: 200,000 VND -> vnp_Amount should be 20,000,000
        mockOrder.setStatus(OrderStatus.PENDING);
        mockOrder.setPaymentStatus(PaymentStatus.UNPAID);

        when(paymentGateway.verifySignature(params)).thenReturn(true);
        when(orderDAO.findByOrderCode("ORD-1001")).thenReturn(Optional.of(mockOrder));

        VNPayIpnResponse response = paymentService.processVNPayIpn(params);

        assertNotNull(response);
        assertEquals("04", response.rspCode());
        assertEquals("Invalid Amount", response.message());
    }

    @Test
    void testProcessVNPayIpn_AlreadyConfirmed_Idempotency_ReturnsCode02() {
        Map<String, String> params = new HashMap<>();
        params.put("vnp_TxnRef", "ORD-1001");
        params.put("vnp_Amount", "20000000");

        OrderEntity mockOrder = new OrderEntity();
        mockOrder.setId("ord-uuid-1");
        mockOrder.setOrderCode("ORD-1001");
        mockOrder.setTotalAmountMinor(200000L);
        mockOrder.setStatus(OrderStatus.CONFIRMED);
        mockOrder.setPaymentStatus(PaymentStatus.PAID); // Already PAID

        when(paymentGateway.verifySignature(params)).thenReturn(true);
        when(orderDAO.findByOrderCode("ORD-1001")).thenReturn(Optional.of(mockOrder));

        VNPayIpnResponse response = paymentService.processVNPayIpn(params);

        assertNotNull(response);
        assertEquals("02", response.rspCode());
        assertEquals("Order already confirmed", response.message());
        verify(paymentDAO, never()).update(any());
        verify(orderDAO, never()).updatePaymentStatus(any(), any());
    }

    @Test
    void testProcessVNPayIpn_Success_UpdatesOrderAndPayment_ReturnsCode00() {
        Map<String, String> params = new HashMap<>();
        params.put("vnp_TxnRef", "ORD-1001");
        params.put("vnp_Amount", "20000000");
        params.put("vnp_ResponseCode", "00");
        params.put("vnp_TransactionStatus", "00");
        params.put("vnp_TransactionNo", "1482910");

        OrderEntity mockOrder = new OrderEntity();
        mockOrder.setId("ord-uuid-1");
        mockOrder.setOrderCode("ORD-1001");
        mockOrder.setTotalAmountMinor(200000L);
        mockOrder.setStatus(OrderStatus.PENDING);
        mockOrder.setPaymentStatus(PaymentStatus.UNPAID);

        PaymentEntity existingPayment = new PaymentEntity(
                "pay-1", "ord-uuid-1", 200000L, PaymentStatus.UNPAID, "ORD-1001", null
        );

        when(paymentGateway.verifySignature(params)).thenReturn(true);
        when(orderDAO.findByOrderCode("ORD-1001")).thenReturn(Optional.of(mockOrder));
        when(paymentDAO.findByOrderId("ord-uuid-1")).thenReturn(Optional.of(existingPayment));

        VNPayIpnResponse response = paymentService.processVNPayIpn(params);

        assertNotNull(response);
        assertEquals("00", response.rspCode());
        assertEquals("Confirm Success", response.message());

        assertEquals(PaymentStatus.PAID, existingPayment.getStatus());
        assertEquals("1482910", existingPayment.getTransactionRef());
        assertNotNull(existingPayment.getPaidAt());

        verify(paymentDAO).update(existingPayment);
        verify(orderDAO).updatePaymentStatus("ord-uuid-1", PaymentStatus.PAID);
        verify(orderDAO).updateStatus("ord-uuid-1", OrderStatus.CONFIRMED);
    }

    @Test
    void testProcessVNPayIpn_FailedPayment_UpdatesPaymentToFailed() {
        Map<String, String> params = new HashMap<>();
        params.put("vnp_TxnRef", "ORD-1001");
        params.put("vnp_Amount", "20000000");
        params.put("vnp_ResponseCode", "24"); // Customer cancelled
        params.put("vnp_TransactionStatus", "02");

        OrderEntity mockOrder = new OrderEntity();
        mockOrder.setId("ord-uuid-1");
        mockOrder.setOrderCode("ORD-1001");
        mockOrder.setTotalAmountMinor(200000L);
        mockOrder.setStatus(OrderStatus.PENDING);
        mockOrder.setPaymentStatus(PaymentStatus.UNPAID);

        PaymentEntity existingPayment = new PaymentEntity(
                "pay-1", "ord-uuid-1", 200000L, PaymentStatus.UNPAID, "ORD-1001", null
        );

        when(paymentGateway.verifySignature(params)).thenReturn(true);
        when(orderDAO.findByOrderCode("ORD-1001")).thenReturn(Optional.of(mockOrder));
        when(paymentDAO.findByOrderId("ord-uuid-1")).thenReturn(Optional.of(existingPayment));

        VNPayIpnResponse response = paymentService.processVNPayIpn(params);

        assertNotNull(response);
        assertEquals("00", response.rspCode()); // VNPay spec requires RspCode 00 acknowledgment of IPN reception
        assertEquals(PaymentStatus.FAILED, existingPayment.getStatus());
        verify(paymentDAO).update(existingPayment);
        verify(orderDAO).updatePaymentStatus("ord-uuid-1", PaymentStatus.FAILED);
        verify(orderDAO, never()).updateStatus(eq("ord-uuid-1"), eq(OrderStatus.CONFIRMED));
    }
}
