package com.example.webchicken.modules.payment.gateway;

import java.util.Map;

/**
 * Payment Gateway abstraction (Open/Closed Principle).
 */
public interface PaymentGateway {

    /**
     * Build payment redirect URL with signed signature.
     */
    String createPaymentUrl(String orderCode, long amountMinor, String orderInfo, String ipAddress);

    /**
     * Verify payment return or webhook signature.
     */
    boolean verifySignature(Map<String, String> params);
}
