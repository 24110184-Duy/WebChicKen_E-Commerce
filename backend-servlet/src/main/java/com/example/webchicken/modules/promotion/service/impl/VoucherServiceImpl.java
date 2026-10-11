package com.example.webchicken.modules.promotion.service.impl;

import com.example.webchicken.common.exception.AuthenticationException;
import com.example.webchicken.common.exception.AuthorizationException;
import com.example.webchicken.common.exception.BusinessException;
import com.example.webchicken.common.exception.NotFoundException;
import com.example.webchicken.common.exception.ValidationException;
import com.example.webchicken.common.model.AuthenticatedUser;
import com.example.webchicken.modules.promotion.dao.VoucherDAO;
import com.example.webchicken.modules.promotion.model.dto.request.CreateVoucherRequest;
import com.example.webchicken.modules.promotion.model.dto.request.ValidateVoucherRequest;
import com.example.webchicken.modules.promotion.model.dto.response.ValidateVoucherResponse;
import com.example.webchicken.modules.promotion.model.dto.response.VoucherResponse;
import com.example.webchicken.modules.promotion.model.entity.VoucherEntity;
import com.example.webchicken.modules.promotion.model.enums.VoucherType;
import com.example.webchicken.modules.promotion.service.VoucherService;
import com.example.webchicken.modules.shop.dao.StoreDAO;
import com.example.webchicken.modules.shop.model.entity.StoreEntity;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Động cơ kiểm tra điều kiện, tạo mới và tính toán số tiền giảm giá của Voucher (TASK-42, TASK-70).
 */
public class VoucherServiceImpl implements VoucherService {

    private final VoucherDAO voucherDAO;
    private final StoreDAO storeDAO;

    public VoucherServiceImpl(VoucherDAO voucherDAO) {
        this(voucherDAO, null);
    }

    public VoucherServiceImpl(VoucherDAO voucherDAO, StoreDAO storeDAO) {
        this.voucherDAO = Objects.requireNonNull(voucherDAO, "voucherDAO must not be null");
        this.storeDAO = storeDAO;
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
    public List<VoucherResponse> getAllVouchers(String storeId, Boolean activeOnly, int page, int size) {
        List<VoucherEntity> entities = voucherDAO.findVouchers(storeId, activeOnly, page, size);
        return entities.stream()
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

        // Kiểm tra phạm vi Gian hàng
        if (v.getStoreId() != null && !v.getStoreId().isBlank()) {
            if (request.storeId() == null || !v.getStoreId().equals(request.storeId())) {
                return ValidateVoucherResponse.invalid(v.getCode(), "Voucher này chỉ áp dụng cho gian hàng được chỉ định");
            }
        }

        // Kiểm tra phạm vi Danh mục (nếu có yêu cầu lọc danh mục)
        if (v.getCategoryId() != null && !v.getCategoryId().isBlank()) {
            if (request.categoryId() != null && !v.getCategoryId().equals(request.categoryId())) {
                return ValidateVoucherResponse.invalid(v.getCode(), "Voucher này chỉ áp dụng cho danh mục sản phẩm được chỉ định");
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
    public VoucherResponse createVoucher(CreateVoucherRequest request, AuthenticatedUser currentUser) {
        if (currentUser == null) {
            throw new AuthenticationException("Vui lòng đăng nhập để tạo voucher");
        }

        if (request == null || request.code() == null || request.code().isBlank()) {
            throw new ValidationException("Mã voucher không được để trống");
        }

        String normalizedCode = request.code().trim().toUpperCase();
        if (voucherDAO.findByCode(normalizedCode).isPresent()) {
            throw new ValidationException("Mã voucher '" + normalizedCode + "' đã tồn tại trên hệ thống");
        }

        if (request.title() == null || request.title().isBlank()) {
            throw new ValidationException("Tên chương trình voucher không được để trống");
        }

        if (request.type() == null) {
            throw new ValidationException("Loại voucher (PERCENTAGE hoặc AMOUNT) là bắt buộc");
        }

        if (request.discountValueMinor() <= 0) {
            throw new ValidationException("Mức giảm giá phải lớn hơn 0");
        }

        if (request.type() == VoucherType.PERCENTAGE && (request.discountValueMinor() < 1 || request.discountValueMinor() > 100)) {
            throw new ValidationException("Mức giảm theo phần trăm phải từ 1% đến 100%");
        }

        LocalDateTime startDate = request.startDate() != null ? request.startDate() : LocalDateTime.now();
        LocalDateTime endDate = request.endDate();
        if (endDate == null) {
            throw new ValidationException("Thời gian kết thúc không được để trống");
        }
        if (endDate.isBefore(startDate)) {
            throw new ValidationException("Thời gian kết thúc phải diễn ra sau thời gian bắt đầu");
        }

        String targetStoreId = null;
        String targetCategoryId = request.categoryId() != null && !request.categoryId().isBlank() ? request.categoryId().trim() : null;

        // Phân quyền tạo voucher:
        if (currentUser.isAdmin()) {
            // Admin có thể tạo voucher cho toàn sàn (storeId = null) hoặc chọn 1 shop cụ thể
            targetStoreId = (request.storeId() != null && !request.storeId().isBlank()) ? request.storeId().trim() : null;
        } else if (currentUser.isSeller()) {
            // Seller BẮT BUỘC chỉ được tạo voucher của shop mình (không được tạo voucher toàn sàn)
            String sellerStoreId = getSellerStoreId(currentUser.userId());
            if (sellerStoreId == null) {
                throw new BusinessException("SELLER_STORE_NOT_FOUND", "Tài khoản người bán chưa liên kết với bất kỳ gian hàng nào.");
            }
            targetStoreId = sellerStoreId;
        } else {
            throw new AuthorizationException("Bạn không có quyền tạo mã giảm giá.");
        }

        VoucherEntity entity = new VoucherEntity();
        entity.setId(UUID.randomUUID().toString());
        entity.setCode(normalizedCode);
        entity.setTitle(request.title().trim());
        entity.setDescription(request.description() != null ? request.description().trim() : null);
        entity.setType(request.type());
        entity.setDiscountValueMinor(request.discountValueMinor());
        entity.setMinOrderValueMinor(Math.max(0, request.minOrderValueMinor()));
        entity.setMaxDiscountAmountMinor(Math.max(0, request.maxDiscountAmountMinor()));
        entity.setStartDate(startDate);
        entity.setEndDate(endDate);
        entity.setStoreId(targetStoreId);
        entity.setCategoryId(targetCategoryId);
        entity.setUsageLimit(request.usageLimit() != null && request.usageLimit() > 0 ? request.usageLimit() : 1000);
        entity.setUsedCount(0);
        entity.setActive(true);

        voucherDAO.save(entity);
        return VoucherResponse.fromEntity(entity);
    }

    @Override
    public VoucherResponse toggleVoucherStatus(String voucherId, AuthenticatedUser currentUser) {
        if (currentUser == null) {
            throw new AuthenticationException("Vui lòng đăng nhập để thay đổi trạng thái voucher");
        }

        VoucherEntity v = voucherDAO.findById(voucherId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy voucher với ID: " + voucherId));

        if (!currentUser.isAdmin()) {
            if (!currentUser.isSeller()) {
                throw new AuthorizationException("Bạn không có quyền chỉnh sửa voucher");
            }
            String sellerStoreId = getSellerStoreId(currentUser.userId());
            if (sellerStoreId == null || !sellerStoreId.equals(v.getStoreId())) {
                throw new AuthorizationException("Bạn chỉ có quyền quản lý voucher thuộc gian hàng của mình.");
            }
        }

        v.setActive(!v.isActive());
        voucherDAO.save(v);
        return VoucherResponse.fromEntity(v);
    }

    @Override
    public void deleteVoucher(String voucherId, AuthenticatedUser currentUser) {
        if (currentUser == null) {
            throw new AuthenticationException("Vui lòng đăng nhập để xóa voucher");
        }

        VoucherEntity v = voucherDAO.findById(voucherId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy voucher với ID: " + voucherId));

        if (!currentUser.isAdmin()) {
            if (!currentUser.isSeller()) {
                throw new AuthorizationException("Bạn không có quyền xóa voucher");
            }
            String sellerStoreId = getSellerStoreId(currentUser.userId());
            if (sellerStoreId == null || !sellerStoreId.equals(v.getStoreId())) {
                throw new AuthorizationException("Bạn chỉ có quyền xóa voucher thuộc gian hàng của mình.");
            }
        }

        voucherDAO.delete(voucherId);
    }

    @Override
    public void markVoucherUsed(String voucherId) {
        if (voucherId != null && !voucherId.isBlank()) {
            voucherDAO.incrementUsedCount(voucherId);
        }
    }

    private String getSellerStoreId(String sellerUserId) {
        if (storeDAO == null || sellerUserId == null) return null;
        return storeDAO.findBySellerId(sellerUserId)
                .map(StoreEntity::getId)
                .orElse(null);
    }
}
