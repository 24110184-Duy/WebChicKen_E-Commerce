package com.example.webchicken.infrastructure.payment;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class VNPayGatewayTest {

    private VNPayGateway gateway;
    private final String tmnCode = "NPV0WRB3";
    private final String hashSecret = "XDYQCWUMBVXKGOYLTEFJNAPKPJKRYOMV";
    private final String payUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    private final String returnUrl = "http://localhost:5173/buyer/payment/result";

    @BeforeEach
    void setUp() {
        gateway = new VNPayGateway(tmnCode, hashSecret, payUrl, returnUrl);
    }

    @Test
    void testCreatePaymentUrl_GeneratesValidUrlWithRequiredParameters() {
        String orderCode = "ORD-20261004-999999";
        long amountMinor = 165000L;
        String ipAddress = "127.0.0.1";

        String url = gateway.createPaymentUrl(orderCode, amountMinor, "Payment test", ipAddress);

        assertNotNull(url);
        assertTrue(url.startsWith(payUrl + "?"));
        assertTrue(url.contains("vnp_TmnCode=NPV0WRB3"));
        assertTrue(url.contains("vnp_Amount=" + (amountMinor * 100)));
        assertTrue(url.contains("vnp_TxnRef=" + orderCode));
        assertTrue(url.contains("vnp_CurrCode=VND"));
        assertTrue(url.contains("vnp_Version=2.1.0"));
        assertTrue(url.contains("vnp_Command=pay"));
        assertTrue(url.contains("vnp_SecureHash="));
    }

    @Test
    void testVerifySignature_ValidSignature_ReturnsTrue() {
        // Build simulated parameters
        String orderCode = "ORD-20261004-111111";
        long amountMinor = 250000L;
        String url = gateway.createPaymentUrl(orderCode, amountMinor, "Order info", "127.0.0.1");

        // Parse query string back into Map
        Map<String, String> params = parseQueryString(url);

        boolean isValid = gateway.verifySignature(params);
        assertTrue(isValid, "Calculated checksum should match generated signature");
    }

    @Test
    void testVerifySignature_TamperedAmount_ReturnsFalse() {
        String orderCode = "ORD-20261004-222222";
        long amountMinor = 500000L;
        String url = gateway.createPaymentUrl(orderCode, amountMinor, "Order info", "127.0.0.1");

        Map<String, String> params = parseQueryString(url);

        // Attacker alters amount from 500,000,00 to 1,000,00
        params.put("vnp_Amount", "100000");

        boolean isValid = gateway.verifySignature(params);
        assertFalse(isValid, "Tampered parameter must fail signature verification");
    }

    @Test
    void testVerifySignature_MissingHash_ReturnsFalse() {
        Map<String, String> params = new HashMap<>();
        params.put("vnp_TxnRef", "ORD-123");
        params.put("vnp_Amount", "1000000");

        assertFalse(gateway.verifySignature(params));
    }

    @Test
    void testVerifySignature_DifferentSecret_ReturnsFalse() {
        VNPayGateway attackerGateway = new VNPayGateway(tmnCode, "WRONGSECRETKEY1234567890ABCDEF", payUrl, returnUrl);
        String url = attackerGateway.createPaymentUrl("ORD-123", 100000L, "Order", "127.0.0.1");

        Map<String, String> params = parseQueryString(url);

        assertFalse(gateway.verifySignature(params), "Signatures generated with different keys must not verify");
    }

    private Map<String, String> parseQueryString(String url) {
        Map<String, String> map = new HashMap<>();
        try {
            URI uri = URI.create(url);
            String query = uri.getQuery();
            if (query != null) {
                String[] pairs = query.split("&");
                for (String pair : pairs) {
                    int idx = pair.indexOf("=");
                    if (idx > 0) {
                        String key = URLDecoder.decode(pair.substring(0, idx), StandardCharsets.US_ASCII);
                        String value = URLDecoder.decode(pair.substring(idx + 1), StandardCharsets.US_ASCII);
                        map.put(key, value);
                    }
                }
            }
        } catch (Exception e) {
            fail("Failed to parse query string: " + e.getMessage());
        }
        return map;
    }
}
