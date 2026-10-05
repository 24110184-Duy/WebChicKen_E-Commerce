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

        // 3. Nếu giữ chỗ này liên kết với một đơn hàng, tự động hủy đơn quá hạn qua OrderStateMachine
        String orderId = reservation.getOrderId();
        if (orderId != null && !orderId.isBlank() && orderDAO != null && orderStateMachine != null) {
            Optional<OrderEntity> orderOpt = orderDAO.findById(orderId);
            if (orderOpt.isPresent()) {
                OrderEntity order = orderOpt.get();
                // Chỉ hủy nếu đơn hàng vẫn đang ở PENDING (chưa được xác nhận thanh toán kịp lúc)
                if (order.getStatus() == OrderStatus.PENDING) {
                    try {
                        orderStateMachine.transition(
                                order,
                                OrderStatus.CANCELLED,
                                OrderActorType.SYSTEM,
                                "RESERVATION_WORKER",
                                "Stock reservation TTL expired (payment timeout)"
                        );
                        log.info("Automatically cancelled pending order [{}] due to reservation expiration", order.getOrderCode());
                    } catch (Exception ex) {
                        log.warn("Could not cancel order [{}] via state machine: {}", order.getOrderCode(), ex.getMessage());
                    }
                } else {
                    log.info("Order [{}] is in status [{}], skipping auto-cancellation.", order.getOrderCode(), order.getStatus());
                }
            }
        }
    }
}
