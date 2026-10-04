package com.example.webchicken.modules.inventory.service.impl;

import com.example.webchicken.common.exception.NotFoundException;
import com.example.webchicken.modules.inventory.dao.InventoryDAO;
import com.example.webchicken.modules.inventory.model.dto.response.StockReservationResponse;
import com.example.webchicken.modules.inventory.model.entity.StockReservationEntity;
import com.example.webchicken.modules.inventory.model.enums.ReservationStatus;
import com.example.webchicken.modules.inventory.service.InventoryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

/**
 * Triển khai cơ chế giữ kho (Stock Reservation) có TTL (TASK-37).
 */
public class InventoryServiceImpl implements InventoryService {

    private static final Logger log = LoggerFactory.getLogger(InventoryServiceImpl.class);
    private final InventoryDAO inventoryDAO;

    public InventoryServiceImpl(InventoryDAO inventoryDAO) {
        this.inventoryDAO = Objects.requireNonNull(inventoryDAO, "inventoryDAO must not be null");
    }

    @Override
    public StockReservationResponse reserveStock(String skuId, int qty, String orderId, int ttlMinutes) {
        if (ttlMinutes <= 0) {
            ttlMinutes = 15; // Mặc định 15 phút
        }

        // 1. Thực hiện khóa nguyên tử trừ tồn kho khả dụng và tăng tồn kho giữ chỗ
        inventoryDAO.reserveStockAtomic(skuId, qty);

        // 2. Tạo bản ghi giữ chỗ trong DB
        String reservationId = UUID.randomUUID().toString();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(ttlMinutes);
        StockReservationEntity reservation = new StockReservationEntity(
                reservationId, skuId, qty, orderId, expiresAt
        );
        inventoryDAO.saveReservation(reservation);

        log.info("Reserved stock: skuId={}, qty={}, orderId={}, expiresAt={}", skuId, qty, orderId, expiresAt);
        return new StockReservationResponse(
                reservation.getId(),
                reservation.getSkuId(),
                reservation.getQuantity(),
                reservation.getOrderId(),
                reservation.getStatus(),
                reservation.getExpiresAt()
        );
    }

    @Override
    public void releaseReservation(String reservationId) {
        StockReservationEntity reservation = inventoryDAO.findReservationById(reservationId)
                .orElseThrow(() -> new NotFoundException("StockReservation", reservationId));

        if (reservation.getStatus() == ReservationStatus.ACTIVE) {
            inventoryDAO.releaseStockAtomic(reservation.getSkuId(), reservation.getQuantity());
            reservation.setStatus(ReservationStatus.RELEASED);
            inventoryDAO.updateReservation(reservation);
            log.info("Released stock reservation: id={}, skuId={}, qty={}", reservationId, reservation.getSkuId(), reservation.getQuantity());
        }
    }

    @Override
    public void releaseReservationByOrder(String orderId) {
        List<StockReservationEntity> reservations = inventoryDAO.findActiveReservationsByOrderId(orderId);
        for (StockReservationEntity r : reservations) {
            inventoryDAO.releaseStockAtomic(r.getSkuId(), r.getQuantity());
            r.setStatus(ReservationStatus.RELEASED);
            inventoryDAO.updateReservation(r);
        }
        log.info("Released {} stock reservations for orderId={}", reservations.size(), orderId);
    }

    @Override
    public void commitReservation(String reservationId) {
        StockReservationEntity reservation = inventoryDAO.findReservationById(reservationId)
                .orElseThrow(() -> new NotFoundException("StockReservation", reservationId));

        if (reservation.getStatus() == ReservationStatus.ACTIVE) {
            inventoryDAO.commitStockAtomic(reservation.getSkuId(), reservation.getQuantity());
            reservation.setStatus(ReservationStatus.COMMITTED);
            inventoryDAO.updateReservation(reservation);
            log.info("Committed stock reservation: id={}, skuId={}, qty={}", reservationId, reservation.getSkuId(), reservation.getQuantity());
        }
    }

    @Override
    public void commitReservationByOrder(String orderId) {
        List<StockReservationEntity> reservations = inventoryDAO.findActiveReservationsByOrderId(orderId);
        for (StockReservationEntity r : reservations) {
            inventoryDAO.commitStockAtomic(r.getSkuId(), r.getQuantity());
            r.setStatus(ReservationStatus.COMMITTED);
            inventoryDAO.updateReservation(r);
        }
        log.info("Committed {} stock reservations for orderId={}", reservations.size(), orderId);
    }

    @Override
    public int cleanupExpiredReservations() {
        LocalDateTime now = LocalDateTime.now();
        List<StockReservationEntity> expiredList = inventoryDAO.findExpiredActiveReservations(now);
        int count = 0;
        for (StockReservationEntity r : expiredList) {
            try {
                inventoryDAO.releaseStockAtomic(r.getSkuId(), r.getQuantity());
                r.setStatus(ReservationStatus.EXPIRED);
                inventoryDAO.updateReservation(r);
                count++;
            } catch (Exception e) {
                log.error("Failed to expire reservation id={}: {}", r.getId(), e.getMessage());
            }
        }
        if (count > 0) {
            log.info("Cleaned up {} expired stock reservations", count);
        }
        return count;
    }

    @Override
    public int getAvailableStock(String skuId) {
        return inventoryDAO.getAvailableStock(skuId);
    }

    @Override
    public boolean checkAvailability(String skuId, int qty) {
        return inventoryDAO.hasAvailableStock(skuId, qty);
    }
}
