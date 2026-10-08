package com.example.webchicken.modules.promotion.service.impl;

import com.example.webchicken.common.exception.NotFoundException;
import com.example.webchicken.modules.promotion.dao.VoucherDAO;
import com.example.webchicken.modules.promotion.model.dto.request.ValidateVoucherRequest;
import com.example.webchicken.modules.promotion.model.dto.response.ValidateVoucherResponse;
import com.example.webchicken.modules.promotion.model.dto.response.VoucherResponse;
import com.example.webchicken.modules.promotion.model.entity.VoucherEntity;
import com.example.webchicken.modules.promotion.model.enums.VoucherType;
import com.example.webchicken.modules.promotion.service.VoucherService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Động cơ kiểm tra điều kiện và tính toán số tiền giảm giá của Voucher (TASK-42).
 */
public class VoucherServiceImpl implements VoucherService {

    private final VoucherDAO voucherDAO;

    public VoucherServiceImpl(VoucherDAO voucherDAO) {
        this.voucherDAO = Objects.requireNonNull(voucherDAO, "voucherDAO must not be null");
    }

    @Override
    public List<VoucherResponse> getAvailableVouchers(String storeId, long orderValueMinor) {
        List<VoucherEntity> entities = voucherDAO.findActiveVouchers(storeId);
        return entities.stream()
                .filter(v -> orderValueMinor <= 0 || orderValueMinor >= v.getMinOrderValueMinor())
                .map(VoucherResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public ValidateVoucherResponse validateVoucher(ValidateVoucherRequest request) {
        if (request == null || request.code() == null || request.code().isBlank()) {
            return ValidateVoucherResponse.invalid("", "Mã voucher không được để trống");
        }

        Optional<VoucherEntity> opt = voucherDAO.findByCode(request.code());
        if (opt.isEmpty()) {
            return ValidateVoucherResponse.invalid(request.code(), "Mã voucher không tồn tại");
        }

        VoucherEntity v = opt.get();
        LocalDateTime now = LocalDateTime.now();

        if (!v.isActive()) {
            return ValidateVoucherResponse.invalid(v.getCode(), "Voucher đã bị vô hiệu hóa");
        }

        if (now.isBefore(v.getStartDate())) {
            return ValidateVoucherResponse.invalid(v.getCode(), "Voucher chưa đến thời gian áp dụng");
        }

        if (now.isAfter(v.getEndDate())) {
            return ValidateVoucherResponse.invalid(v.getCode(), "Voucher đã hết hạn sử dụng");
        }

        if (v.getUsedCount() >= v.getUsageLimit()) {
            return ValidateVoucherResponse.invalid(v.getCode(), "Voucher đã hết lượt sử dụng");
        }

        if (request.orderValueMinor() < v.getMinOrderValueMinor()) {
            return ValidateVoucherResponse.invalid(v.getCode(),
                    "Đơn hàng chưa đạt giá trị tối thiểu " + v.getMinOrderValueMinor() + " để áp dụng voucher");
        }

        if (v.getStoreId() != null && !v.getStoreId().isBlank()) {
            if (request.storeId() == null || !v.getStoreId().equals(request.storeId())) {
                return ValidateVoucherResponse.invalid(v.getCode(), "Voucher này chỉ áp dụng cho gian hàng được chỉ định");
            }
        }

        long discountMinor;
        if (v.getType() == VoucherType.PERCENTAGE) {
            discountMinor = (request.orderValueMinor() * v.getDiscountValueMinor()) / 100;
            if (v.getMaxDiscountAmountMinor() > 0 && discountMinor > v.getMaxDiscountAmountMinor()) {
                discountMinor = v.getMaxDiscountAmountMinor();
            }
        } else {
            discountMinor = Math.min(v.getDiscountValueMinor(), request.orderValueMinor());
        }

        long finalAmountMinor = Math.max(0, request.orderValueMinor() - discountMinor);
        return ValidateVoucherResponse.valid(v.getId(), v.getCode(), discountMinor, finalAmountMinor);
    }

    @Override
    public VoucherResponse getVoucherByCode(String code) {
        return voucherDAO.findByCode(code)
                .map(VoucherResponse::fromEntity)
                .orElseThrow(() -> new NotFoundException("Voucher not found with code: " + code));
    }

    @Override
    public void markVoucherUsed(String voucherId) {
        if (voucherId != null && !voucherId.isBlank()) {
            voucherDAO.incrementUsedCount(voucherId);
        }
    }
}
