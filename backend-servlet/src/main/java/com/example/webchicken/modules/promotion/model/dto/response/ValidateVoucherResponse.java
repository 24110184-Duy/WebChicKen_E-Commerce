package com.example.webchicken.modules.promotion.model.dto.response;

public record ValidateVoucherResponse(
        String voucherId,
        String code,
        boolean isValid,
        long discountAmountMinor,
        long finalAmountMinor,
        String message
) {
    public static ValidateVoucherResponse valid(String voucherId, String code, long discountMinor, long finalMinor) {
        return new ValidateVoucherResponse(voucherId, code, true, discountMinor, finalMinor, "Voucher applied successfully");
    }

    public static ValidateVoucherResponse invalid(String code, String message) {
        return new ValidateVoucherResponse(null, code, false, 0, 0, message);
    }
}
