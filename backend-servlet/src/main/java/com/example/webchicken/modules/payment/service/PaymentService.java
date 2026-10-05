package com.example.webchicken.modules.payment.service;

import com.example.webchicken.modules.payment.model.dto.response.PaymentMethodResponse;
import com.example.webchicken.modules.payment.model.dto.response.PaymentResponse;
import com.example.webchicken.modules.payment.model.dto.response.PaymentUrlResponse;
import com.example.webchicken.modules.payment.model.dto.response.VNPayIpnResponse;
import java.util.List;
import java.util.Map;

/**
 * Payment Service interface for COD, online gateways, and IPN webhook (TASK-50, TASK-51 & TASK-52).
 */
public interface PaymentService {

    PaymentResponse createCodPayment(String orderId, long amountMinor);

    PaymentResponse getPaymentByOrderId(String orderId);

    PaymentResponse confirmCodPayment(String orderId);

    PaymentUrlResponse createVNPayPaymentUrl(String orderCode, String ipAddress);

    VNPayIpnResponse processVNPayIpn(Map<String, String> params);

    List<PaymentMethodResponse> getAvailablePaymentMethods();
}
