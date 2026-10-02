package com.example.webchicken.modules.shop.service;

import com.example.webchicken.modules.shop.model.dto.request.UpdateStoreRequest;
import com.example.webchicken.modules.shop.model.dto.response.StoreResponse;

/**
 * Service quản lý thông tin gian hàng (Store).
 */
public interface StoreService {

    /** Lấy thông tin gian hàng theo mã Store ID. */
    StoreResponse getStoreById(String storeId);

    /** Lấy thông tin gian hàng của một Người bán (Seller ID). */
    StoreResponse getStoreBySellerId(String sellerId);

    /** Cập nhật thông tin gian hàng (Kiểm tra quyền sở hữu IDOR). */
    StoreResponse updateStore(String storeId, String sellerId, UpdateStoreRequest request);
}
