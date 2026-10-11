package com.example.webchicken.modules.shop.service.impl;

import com.example.webchicken.common.exception.AuthorizationException;
import com.example.webchicken.common.exception.NotFoundException;
import com.example.webchicken.common.exception.ValidationException;
import com.example.webchicken.modules.shop.dao.StoreDAO;
import com.example.webchicken.modules.shop.model.dto.request.UpdateStoreRequest;
import com.example.webchicken.modules.shop.model.dto.response.StoreResponse;
import com.example.webchicken.modules.shop.model.entity.StoreEntity;
import com.example.webchicken.modules.shop.service.StoreService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Objects;

public class StoreServiceImpl implements StoreService {

    private static final Logger log = LoggerFactory.getLogger(StoreServiceImpl.class);

    private final StoreDAO storeDAO;
    private final com.example.webchicken.modules.identity.dao.SellerDAO sellerDAO;
    private final com.example.webchicken.modules.identity.dao.UserDAO userDAO;
    private final com.example.webchicken.modules.identity.dao.AdminDAO adminDAO;

    public StoreServiceImpl(StoreDAO storeDAO) {
        this(storeDAO, null, null, null);
    }

    public StoreServiceImpl(StoreDAO storeDAO,
                            com.example.webchicken.modules.identity.dao.SellerDAO sellerDAO,
                            com.example.webchicken.modules.identity.dao.UserDAO userDAO) {
        this(storeDAO, sellerDAO, userDAO, null);
    }

    public StoreServiceImpl(StoreDAO storeDAO,
                            com.example.webchicken.modules.identity.dao.SellerDAO sellerDAO,
                            com.example.webchicken.modules.identity.dao.UserDAO userDAO,
                            com.example.webchicken.modules.identity.dao.AdminDAO adminDAO) {
        this.storeDAO = Objects.requireNonNull(storeDAO, "storeDAO must not be null");
        this.sellerDAO = sellerDAO;
        this.userDAO = userDAO;
        this.adminDAO = adminDAO;
    }

    private boolean isUserAdmin(String userId) {
        if (userId == null || userId.isBlank()) return false;
        if (adminDAO != null && adminDAO.findById(userId).isPresent()) {
            return true;
        }
        if (userDAO != null) {
            return userDAO.findById(userId)
                    .map(u -> u instanceof com.example.webchicken.modules.identity.model.entity.AdminEntity)
                    .orElse(false);
        }
        return false;
    }

    @Override
    public StoreResponse getStoreById(String storeId) {
        if (storeId == null || storeId.isBlank()) {
            throw new ValidationException("Mã gian hàng không hợp lệ.");
        }
        return storeDAO.findById(storeId)
                .map(this::toResponse)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy gian hàng với ID: " + storeId));
    }

    @Override
    public StoreResponse getStoreBySellerId(String sellerId) {
        if (sellerId == null || sellerId.isBlank()) {
            throw new ValidationException("Mã người bán không hợp lệ.");
        }
        java.util.Optional<StoreEntity> storeOpt = storeDAO.findBySellerId(sellerId);
        if (storeOpt.isPresent()) {
            return toResponse(storeOpt.get());
        }

        // Tự động khởi tạo gian hàng độc lập cho tài khoản Admin hoặc Seller chưa có Store (Multi-Admin Isolation)
        boolean isAdmin = isUserAdmin(sellerId);
        boolean hasSellerProfile = (sellerDAO != null && sellerDAO.findById(sellerId).isPresent());

        if (isAdmin || hasSellerProfile) {
            StoreEntity newStore = createDedicatedStore(sellerId, isAdmin);
            if (newStore != null) {
                return toResponse(newStore);
            }
        }

        throw new NotFoundException("Tài khoản chưa có gian hàng trên hệ thống.");
    }

    private synchronized StoreEntity createDedicatedStore(String sellerId, boolean isAdmin) {
        // Kiểm tra lại xem trong lúc chờ có luồng nào đã tạo chưa
        var existing = storeDAO.findBySellerId(sellerId);
        if (existing.isPresent()) {
            return existing.get();
        }

        // Đảm bảo có profile trong bảng sellers
        if (sellerDAO != null) {
            com.example.webchicken.modules.identity.model.entity.SellerEntity seller =
                    new com.example.webchicken.modules.identity.model.entity.SellerEntity();
            seller.setUserId(sellerId);
            seller.setApprovedAt(java.time.LocalDateTime.now());
            sellerDAO.save(seller);
        }

        // Tạo gian hàng độc lập hoàn toàn mới cho từng Quản trị viên / Người bán
        String storeName = "Gian Hàng";
        if (userDAO != null) {
            var uOpt = userDAO.findById(sellerId);
            if (uOpt.isPresent()) {
                var u = uOpt.get();
                if (u.getFullName() != null && !u.getFullName().isBlank()) {
                    storeName = u.getFullName() + (isAdmin ? " Official Store" : " Store");
                } else if (u.getUsername() != null && !u.getUsername().isBlank()) {
                    storeName = u.getUsername() + (isAdmin ? " Official Store" : " Store");
                }
            }
        }

        String storeId = java.util.UUID.randomUUID().toString();
        StoreEntity store = new StoreEntity(
                storeId,
                storeName,
                isAdmin ? "MALL" : "SELLER",
                sellerId,
                java.time.LocalDateTime.now()
        );
        storeDAO.save(store);
        log.info("Đã tự động khởi tạo gian hàng độc lập mới [{}] (ID: {}) cho tài khoản {}", storeName, storeId, sellerId);
        return store;
    }

    @Override
    public StoreResponse updateStore(String storeId, String sellerId, UpdateStoreRequest request) {
        if (storeId == null || storeId.isBlank()) {
            throw new ValidationException("Mã gian hàng không hợp lệ.");
        }
        if (request == null || request.storeName() == null || request.storeName().trim().isBlank()) {
            throw new ValidationException("Tên gian hàng không được để trống.");
        }

        StoreEntity store = storeDAO.findById(storeId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy gian hàng với ID: " + storeId));

        // Kiểm tra quyền sở hữu IDOR (SEC-09): Cho phép nếu là chủ sở hữu hoặc Quản trị viên
        boolean isOwner = store.getSellerId().equals(sellerId);
        boolean isAdmin = isUserAdmin(sellerId);
        if (!isOwner && !isAdmin) {
            throw new AuthorizationException("Bạn không có quyền chỉnh sửa gian hàng này.");
        }

        store.setStoreName(request.storeName().trim());
        StoreEntity updated = storeDAO.update(store);
        log.info("Người bán {} đã cập nhật tên gian hàng thành: {}", sellerId, updated.getStoreName());

        return toResponse(updated);
    }

    private StoreResponse toResponse(StoreEntity store) {
        return new StoreResponse(
                store.getId(),
                store.getStoreName(),
                store.getStoreType(),
                store.getSellerId(),
                store.getCreatedAt()
        );
    }
}
