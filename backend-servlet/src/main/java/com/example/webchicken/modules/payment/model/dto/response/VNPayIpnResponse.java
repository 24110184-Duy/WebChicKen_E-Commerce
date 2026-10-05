package com.example.webchicken.modules.payment.model.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Standard response payload for VNPay IPN (Instant Payment Notification).
 */
public record VNPayIpnResponse(
        @JsonProperty("RspCode") String rspCode,
        @JsonProperty("Message") String message
) {
    public static VNPayIpnResponse success() {
        return new VNPayIpnResponse("00", "Confirm Success");
    }

    public static VNPayIpnResponse orderNotFound() {
        return new VNPayIpnResponse("01", "Order not found");
    }

    public static VNPayIpnResponse alreadyConfirmed() {
        return new VNPayIpnResponse("02", "Order already confirmed");
    }

    public static VNPayIpnResponse invalidAmount() {
        return new VNPayIpnResponse("04", "Invalid Amount");
    }

    public static VNPayIpnResponse invalidChecksum() {
        return new VNPayIpnResponse("97", "Invalid Checksum");
    }

    public static VNPayIpnResponse unknownError(String msg) {
        return new VNPayIpnResponse("99", msg != null ? msg : "Unknown error");
    }
}
