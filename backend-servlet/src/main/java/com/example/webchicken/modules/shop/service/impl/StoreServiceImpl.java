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

    public StoreServiceImpl(StoreDAO storeDAO) {
        this(storeDAO, null, null);
    }

    public StoreServiceImpl(StoreDAO storeDAO,
                            com.example.webchicken.modules.identity.dao.SellerDAO sellerDAO,
                            com.example.webchicken.modules.identity.dao.UserDAO userDAO) {
        this.storeDAO = Objects.requireNonNull(storeDAO, "storeDAO must not be null");
        this.sellerDAO = sellerDAO;
        this.userDAO = userDAO;
    }

    @Override
    public StoreResponse getStoreById(String storeId) {
        if (storeId == null || storeId.isBlank()) {
            throw new ValidationException("Mã gian hàng không hợp lệ.");
        }
        StoreEntity store = storeDAO.findById(storeId).orElse(null);
        if (store != null) {
            return toResponse(store);
        }

        // Nếu là fallback storeId hoặc gian hàng chưa tìm thấy, lấy gian hàng đầu tiên trên hệ thống
        java.util.List<StoreEntity> anyStores = storeDAO.findAll(1, 1);
        if (!anyStores.isEmpty()) {
            return toResponse(anyStores.get(0));
        }

        throw new NotFoundException("Không tìm thấy gian hàng với ID: " + storeId);
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

        // Tự động khởi tạo gian hàng nếu tài khoản đã tồn tại (Admin hoặc Seller)
        if (userDAO != null && sellerDAO != null) {
            java.util.Optional<com.example.webchicken.modules.identity.model.entity.UserEntity> userOpt = userDAO.findById(sellerId);
            if (userOpt.isPresent()) {
                java.time.LocalDateTime now = java.time.LocalDateTime.now();
                if (sellerDAO.findById(sellerId).isEmpty()) {
                    com.example.webchicken.modules.identity.model.entity.SellerEntity seller = new com.example.webchicken.modules.identity.model.entity.SellerEntity();
                    seller.setUserId(sellerId);
                    seller.setApprovedAt(now);
                    sellerDAO.save(seller);
                }

                com.example.webchicken.modules.identity.model.entity.UserEntity u = userOpt.get();
                String storeName = (u.getFullName() != null && !u.getFullName().isBlank())
                        ? u.getFullName() + " Mall"
                        : "WebChicKen Official Store";

                StoreEntity newStore = new StoreEntity(
                        java.util.UUID.randomUUID().toString(),
                        storeName,
                        "MALL",
                        sellerId,
                        now
                );
                storeDAO.save(newStore);
                log.info("Đã tự động khởi tạo gian hàng [{}] ({}) cho tài khoản {}", storeName, newStore.getId(), sellerId);
                return toResponse(newStore);
            }
        }

        throw new NotFoundException("Người bán chưa có gian hàng trên hệ thống.");
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

        // Kiểm tra quyền sở hữu IDOR (SEC-09)
        if (!store.getSellerId().equals(sellerId)) {
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
