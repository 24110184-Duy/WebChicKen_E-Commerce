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

    public StoreServiceImpl(StoreDAO storeDAO) {
        this.storeDAO = Objects.requireNonNull(storeDAO, "storeDAO must not be null");
    }

    @Override
    public StoreResponse getStoreById(String storeId) {
        if (storeId == null || storeId.isBlank()) {
            throw new ValidationException("Mã gian hàng không hợp lệ.");
        }
        StoreEntity store = storeDAO.findById(storeId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy gian hàng với ID: " + storeId));
        return toResponse(store);
    }

    @Override
    public StoreResponse getStoreBySellerId(String sellerId) {
        if (sellerId == null || sellerId.isBlank()) {
            throw new ValidationException("Mã người bán không hợp lệ.");
        }
        StoreEntity store = storeDAO.findBySellerId(sellerId)
                .orElseThrow(() -> new NotFoundException("Người bán chưa có gian hàng trên hệ thống."));
        return toResponse(store);
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
