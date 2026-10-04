package com.example.webchicken.modules.inventory.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import com.example.webchicken.modules.catalog.model.entity.ProductVariantEntity;
import com.example.webchicken.modules.inventory.exception.InsufficientStockException;
import com.example.webchicken.modules.inventory.model.entity.StockReservationEntity;
import com.example.webchicken.modules.inventory.model.enums.ReservationStatus;
import jakarta.persistence.EntityManagerFactory;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Data Access Object cho quản lý tồn kho và biến động kho (TASK-36 & TASK-37).
 * Cung cấp câu lệnh UPDATE nguyên tử chống bán vượt tồn (Anti-Overselling).
 */
public class InventoryDAO extends BaseDAO {

    public InventoryDAO(EntityManagerFactory emf) {
        super(emf);
    }

    /**
     * Khóa chống bán vượt tồn: Giảm stock_quantity và tăng reserved_quantity nguyên tử.
     * UPDATE product_variants SET stock = stock - :qty, reserved = reserved + :qty
     * WHERE id = :skuId AND stock >= :qty
     *
     * @param skuId ID của biến thể (SKU)
     * @param qty   Số lượng cần giữ
     * @throws InsufficientStockException nếu tồn kho không đủ (rows affected = 0)
     */
    public void reserveStockAtomic(String skuId, int qty) {
        if (qty <= 0) {
            throw new IllegalArgumentException("Quantity to reserve must be greater than 0");
        }
        executeInTransaction(em -> {
            int updated = em.createQuery(
                    "UPDATE ProductVariantEntity v SET v.stockQuantity = v.stockQuantity - :qty, " +
                    "v.reservedQuantity = v.reservedQuantity + :qty " +
                    "WHERE v.id = :skuId AND v.stockQuantity >= :qty")
                    .setParameter("qty", qty)
                    .setParameter("skuId", skuId)
                    .executeUpdate();

            if (updated == 0) {
                ProductVariantEntity variant = em.find(ProductVariantEntity.class, skuId);
                int available = (variant != null) ? variant.getStockQuantity() : 0;
                throw new InsufficientStockException(skuId, qty, available);
            }
        });
    }

    /**
     * Nhả kho đã giữ: Tăng lại stock_quantity và giảm reserved_quantity.
     */
    public void releaseStockAtomic(String skuId, int qty) {
        if (qty <= 0) return;
        executeInTransaction(em -> {
            em.createQuery(
                    "UPDATE ProductVariantEntity v SET v.stockQuantity = v.stockQuantity + :qty, " +
                    "v.reservedQuantity = CASE WHEN v.reservedQuantity >= :qty THEN v.reservedQuantity - :qty ELSE 0 END " +
                    "WHERE v.id = :skuId")
                    .setParameter("qty", qty)
                    .setParameter("skuId", skuId)
                    .executeUpdate();
        });
    }

    /**
     * Chốt kho đã bán (commit): Giảm reserved_quantity (hàng đã trừ khỏi stock khi đặt).
     */
    public void commitStockAtomic(String skuId, int qty) {
        if (qty <= 0) return;
        executeInTransaction(em -> {
            em.createQuery(
                    "UPDATE ProductVariantEntity v SET " +
                    "v.reservedQuantity = CASE WHEN v.reservedQuantity >= :qty THEN v.reservedQuantity - :qty ELSE 0 END " +
                    "WHERE v.id = :skuId")
                    .setParameter("qty", qty)
                    .setParameter("skuId", skuId)
                    .executeUpdate();
        });
    }

    /**
     * Lấy số lượng tồn kho khả dụng hiện tại.
     */
    public int getAvailableStock(String skuId) {
        return executeQuery(em -> {
            ProductVariantEntity v = em.find(ProductVariantEntity.class, skuId);
            return (v != null) ? v.getStockQuantity() : 0;
        });
    }

    /**
     * Kiểm tra nhanh SKU có đủ số lượng khả dụng không.
     */
    public boolean hasAvailableStock(String skuId, int qty) {
        return getAvailableStock(skuId) >= qty;
    }

    // ── Quản lý bảng stock_reservations (TASK-37) ─────────────────────────────

    public void saveReservation(StockReservationEntity entity) {
        executeInTransaction(em -> em.persist(entity));
    }

    public void updateReservation(StockReservationEntity entity) {
        executeInTransaction(em -> {
            entity.setUpdatedAt(LocalDateTime.now());
            em.merge(entity);
        });
    }

    public Optional<StockReservationEntity> findReservationById(String reservationId) {
        return executeQuery(em -> Optional.ofNullable(em.find(StockReservationEntity.class, reservationId)));
    }

    public List<StockReservationEntity> findActiveReservationsByOrderId(String orderId) {
        return executeQuery(em -> em.createQuery(
                "SELECT r FROM StockReservationEntity r WHERE r.orderId = :orderId AND r.status = :status",
                StockReservationEntity.class)
                .setParameter("orderId", orderId)
                .setParameter("status", ReservationStatus.ACTIVE)
                .getResultList());
    }

    public List<StockReservationEntity> findExpiredActiveReservations(LocalDateTime now) {
        return executeQuery(em -> em.createQuery(
                "SELECT r FROM StockReservationEntity r WHERE r.status = :status AND r.expiresAt <= :now",
                StockReservationEntity.class)
                .setParameter("status", ReservationStatus.ACTIVE)
                .setParameter("now", now)
                .getResultList());
    }
}
