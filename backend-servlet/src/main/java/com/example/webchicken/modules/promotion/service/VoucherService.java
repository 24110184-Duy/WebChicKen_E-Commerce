package com.example.webchicken.modules.promotion.service;

import com.example.webchicken.common.model.AuthenticatedUser;
import com.example.webchicken.modules.promotion.model.dto.request.CreateVoucherRequest;
import com.example.webchicken.modules.promotion.model.dto.request.ValidateVoucherRequest;
import com.example.webchicken.modules.promotion.model.dto.response.ValidateVoucherResponse;
import com.example.webchicken.modules.promotion.model.dto.response.VoucherResponse;

import java.util.List;

public interface VoucherService {

    List<VoucherResponse> getAvailableVouchers(String storeId, long orderValueMinor);

    List<VoucherResponse> getAllVouchers(String storeId, Boolean activeOnly, int page, int size);

    ValidateVoucherResponse validateVoucher(ValidateVoucherRequest request);

    VoucherResponse getVoucherByCode(String code);

    VoucherResponse createVoucher(CreateVoucherRequest request, AuthenticatedUser currentUser);

    VoucherResponse toggleVoucherStatus(String voucherId, AuthenticatedUser currentUser);

    void deleteVoucher(String voucherId, AuthenticatedUser currentUser);

    void markVoucherUsed(String voucherId);
}
