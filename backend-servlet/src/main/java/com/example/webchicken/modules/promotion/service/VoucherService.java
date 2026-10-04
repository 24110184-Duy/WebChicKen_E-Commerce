package com.example.webchicken.modules.promotion.service;

import com.example.webchicken.modules.promotion.model.dto.request.ValidateVoucherRequest;
import com.example.webchicken.modules.promotion.model.dto.response.ValidateVoucherResponse;
import com.example.webchicken.modules.promotion.model.dto.response.VoucherResponse;

import java.util.List;

public interface VoucherService {

    List<VoucherResponse> getAvailableVouchers(String storeId, long orderValueMinor);

    ValidateVoucherResponse validateVoucher(ValidateVoucherRequest request);

    VoucherResponse getVoucherByCode(String code);

    void markVoucherUsed(String voucherId);
}
