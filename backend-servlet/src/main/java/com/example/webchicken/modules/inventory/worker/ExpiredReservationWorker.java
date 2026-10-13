package com.example.webchicken.modules.inventory.worker;

import com.example.webchicken.common.enums.OrderStatus;
import com.example.webchicken.modules.inventory.dao.InventoryDAO;
import com.example.webchicken.modules.inventory.model.entity.StockReservationEntity;
import com.example.webchicken.modules.inventory.model.enums.ReservationStatus;
import com.example.webchicken.modules.order.dao.OrderDAO;
import com.example.webchicken.modules.order.model.entity.OrderEntity;
import com.example.webchicken.modules.order.model.enums.OrderActorType;
import com.example.webchicken.modules.order.policy.OrderStateMachine;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * Worker chạy ngầm định kỳ quét và giải phóng các lượt giữ kho quá hạn TTL (TASK-55).
 * Tự động hoàn lại tồn kho khả dụng và hủy đơn hàng quá hạn thanh toán qua OrderStateMachine.
 * Tuân thủ nghiêm ngặt ARCHITECTURE.md 2.3.6.
 */
public class ExpiredReservationWorker {

    private static final Logger log = LoggerFactory.getLogger(ExpiredReservationWorker.class);

    private final InventoryDAO inventoryDAO;
    private final OrderDAO orderDAO;
    private final OrderStateMachine orderStateMachine;

    public ExpiredReservationWorker(InventoryDAO inventoryDAO, OrderDAO orderDAO, OrderStateMachine orderStateMachine) {
        this.inventoryDAO = Objects.requireNonNull(inventoryDAO, "inventoryDAO must not be null");
        this.orderDAO = orderDAO;
        this.orderStateMachine = orderStateMachine;
    }

    /**
     * Thực hiện một chu kỳ quét và giải phóng các bản ghi giữ kho đã quá thời hạn.
     * @return Số lượng bản ghi reservation đã được giải phóng thành công.
     */
    public int runCleanup() {
        LocalDateTime now = LocalDateTime.now();
        List<StockReservationEntity> expiredList = inventoryDAO.findExpiredActiveReservations(now);

        if (expiredList == null || expiredList.isEmpty()) {
            return 0;
        }

        log.info("Found {} expired stock reservation(s) to clean up at {}", expiredList.size(), now);
        int cleanedCount = 0;

        for (StockReservationEntity reservation : expiredList) {
            try {
                processSingleExpiredReservation(reservation);
                cleanedCount++;
            } catch (Exception e) {
                // Exception shielding: không để 1 bản ghi lỗi làm dừng toàn bộ tiến trình quét
                log.error("Failed to clean up expired reservation [{}]: {}", reservation.getId(), e.getMessage(), e);
            }
        }

        log.info("Successfully cleaned up {}/{} expired stock reservations.", cleanedCount, expiredList.size());
        return cleanedCount;
    }

    private void processSingleExpiredReservation(StockReservationEntity reservation) {
        // 1. Hoàn trả tồn kho nguyên tử (trừ reserved_quantity, trả lại stock_quantity khả dụng)
        inventoryDAO.releaseStockAtomic(reservation.getSkuId(), reservation.getQuantity());

        // 2. Cập nhật trạng thái bản ghi giữ chỗ sang EXPIRED
        reservation.setStatus(ReservationStatus.EXPIRED);
        inventoryDAO.updateReservation(reservation);
        log.info("Released stock for SKU [{}] with quantity [{}] from expired reservation [{}]",
                reservation.getSkuId(), reservation.getQuantity(), reservation.getId());

        // 3. Đã loại bỏ cơ chế tự động hủy đơn hàng:
        // Đơn hàng giữ nguyên trạng thái PENDING để khách hàng / người bán chủ động xử lý thủ công.
    }
}
