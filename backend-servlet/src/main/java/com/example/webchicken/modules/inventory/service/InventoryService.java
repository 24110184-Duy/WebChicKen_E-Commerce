package com.example.webchicken.modules.inventory.service;

import com.example.webchicken.modules.inventory.model.dto.response.StockReservationResponse;

/**
 * Service quản lý tồn kho và cơ chế giữ kho (Stock Reservation) có TTL (TASK-37).
 */
public interface InventoryService {

    /**
     * Giữ kho tạm thời cho một SKU trong thời hạn ttlMinutes.
     * Thao tác nguyên tử chống bán vượt tồn (Overselling).
     */
    StockReservationResponse reserveStock(String skuId, int qty, String orderId, int ttlMinutes);

    /**
     * Nhả kho đã giữ theo reservation ID khi đơn hàng bị hủy hoặc hết hạn thanh toán.
     */
    void releaseReservation(String reservationId);

    /**
     * Nhả toàn bộ các lượt giữ kho của một đơn hàng.
     */
    void releaseReservationByOrder(String orderId);

    /**
     * Chốt kho (commit) khi thanh toán thành công.
     */
    void commitReservation(String reservationId);

    /**
     * Chốt toàn bộ các lượt giữ kho của một đơn hàng khi thanh toán thành công.
     */
    void commitReservationByOrder(String orderId);

    /**
     * Quét và giải phóng các reservation đã quá hạn (TTL).
     * @return Số lượng reservation đã giải phóng
     */
    int cleanupExpiredReservations();

    /**
     * Lấy số lượng tồn khả dụng hiện tại của SKU.
     */
    int getAvailableStock(String skuId);

    /**
     * Kiểm tra SKU có đủ số lượng khả dụng không.
     */
    boolean checkAvailability(String skuId, int qty);
}
