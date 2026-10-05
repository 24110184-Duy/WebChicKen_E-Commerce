package com.example.webchicken.infrastructure.payment;

import com.example.webchicken.modules.payment.gateway.PaymentGateway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * VNPay Payment Gateway adapter v2.1.0 with HMAC-SHA512 signing.
 */
public class VNPayGateway implements PaymentGateway {

    private static final Logger log = LoggerFactory.getLogger(VNPayGateway.class);

    private final String tmnCode;
    private final String hashSecret;
    private final String payUrl;
    private final String returnUrl;

    public VNPayGateway() {
        this.tmnCode = getEnvOrDefault("VNP_TMN_CODE", "NPV0WRB3");
        this.hashSecret = getEnvOrDefault("VNP_HASH_SECRET", "XDYQCWUMBVXKGOYLTEFJNAPKPJKRYOMV");
        this.payUrl = getEnvOrDefault("VNP_PAY_URL", "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html");
        this.returnUrl = getEnvOrDefault("VNP_RETURN_URL", "http://localhost:5173/buyer/payment/result");
    }

    public VNPayGateway(String tmnCode, String hashSecret, String payUrl, String returnUrl) {
        this.tmnCode = tmnCode;
        this.hashSecret = hashSecret;
        this.payUrl = payUrl;
        this.returnUrl = returnUrl;
    }

    private static String getEnvOrDefault(String key, String defVal) {
        String val = System.getenv(key);
        if (val == null || val.isBlank()) {
            val = System.getProperty(key);
        }
        return (val != null && !val.isBlank()) ? val : defVal;
    }

    @Override
    public String createPaymentUrl(String orderCode, long amountMinor, String orderInfo, String ipAddress) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        LocalDateTime now = LocalDateTime.now();
        String createDate = now.format(formatter);
        String expireDate = now.plusMinutes(15).format(formatter);

        // VNPay standard: amount in minor units multiplied by 100
        long vnpAmount = amountMinor * 100;

        Map<String, String> vnpParams = new HashMap<>();
        vnpParams.put("vnp_Version", "2.1.0");
        vnpParams.put("vnp_Command", "pay");
        vnpParams.put("vnp_TmnCode", this.tmnCode);
        vnpParams.put("vnp_Amount", String.valueOf(vnpAmount));
        vnpParams.put("vnp_CurrCode", "VND");
        vnpParams.put("vnp_TxnRef", orderCode);
        vnpParams.put("vnp_OrderInfo", (orderInfo != null && !orderInfo.isBlank()) ? orderInfo : "Payment for order " + orderCode);
        vnpParams.put("vnp_OrderType", "other");
        vnpParams.put("vnp_Locale", "vn");
        vnpParams.put("vnp_ReturnUrl", this.returnUrl);
        vnpParams.put("vnp_IpAddr", (ipAddress != null && !ipAddress.isBlank()) ? ipAddress : "127.0.0.1");
        vnpParams.put("vnp_CreateDate", createDate);
        vnpParams.put("vnp_ExpireDate", expireDate);

        // Sort parameters alphabetically
        List<String> fieldNames = new ArrayList<>(vnpParams.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();

        for (int i = 0; i < fieldNames.size(); i++) {
            String fieldName = fieldNames.get(i);
            String fieldValue = vnpParams.get(fieldName);
            if (fieldValue != null && !fieldValue.isBlank()) {
                String encodedKey = URLEncoder.encode(fieldName, StandardCharsets.US_ASCII);
                String encodedVal = URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII);

                hashData.append(fieldName).append('=').append(encodedVal);
                query.append(encodedKey).append('=').append(encodedVal);

                if (i < fieldNames.size() - 1) {
                    hashData.append('&');
                    query.append('&');
                }
            }
        }

        // HMAC-SHA512 checksum calculation
        String secureHash = hmacSHA512(this.hashSecret, hashData.toString());
        query.append("&vnp_SecureHash=").append(secureHash);

        return this.payUrl + "?" + query.toString();
    }

    @Override
    public boolean verifySignature(Map<String, String> fields) {
        String secureHash = fields.get("vnp_SecureHash");
        if (secureHash == null || secureHash.isBlank()) {
            return false;
        }

        Map<String, String> filtered = new HashMap<>(fields);
        filtered.remove("vnp_SecureHash");
        filtered.remove("vnp_SecureHashType");

        List<String> fieldNames = new ArrayList<>(filtered.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        for (int i = 0; i < fieldNames.size(); i++) {
            String fieldName = fieldNames.get(i);
            String fieldValue = filtered.get(fieldName);
            if (fieldValue != null && !fieldValue.isBlank()) {
                hashData.append(fieldName).append('=').append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                if (i < fieldNames.size() - 1) {
                    hashData.append('&');
                }
            }
        }

        String calculatedHash = hmacSHA512(this.hashSecret, hashData.toString());
        return secureHash.equalsIgnoreCase(calculatedHash);
    }

    public static String hmacSHA512(String key, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            mac.init(secretKey);
            byte[] hmacBytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(2 * hmacBytes.length);
            for (byte b : hmacBytes) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (Exception e) {
            log.error("Failed to compute HMAC-SHA512: {}", e.getMessage(), e);
            throw new RuntimeException("Error calculating HMAC-SHA512", e);
        }
    }
}
