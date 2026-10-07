package com.example.webchicken.modules.order.worker;

import com.example.webchicken.common.enums.OrderStatus;
import com.example.webchicken.modules.order.dao.OrderDAO;
import com.example.webchicken.modules.order.dao.OrderStatusHistoryDAO;
import com.example.webchicken.modules.order.model.entity.OrderEntity;
import com.example.webchicken.modules.order.model.entity.OrderStatusHistoryEntity;
import com.example.webchicken.modules.order.model.enums.OrderActorType;
import com.example.webchicken.modules.order.policy.OrderStateMachine;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

/**
 * Worker chạy ngầm định kỳ mô phỏng quá trình vận chuyển (Shipping Simulation Job) (TASK-68).
 * Quét các đơn hàng ở trạng thái SHIPPING, sau một khoảng thời gian giả lập tự động chuyển sang DELIVERED
 * thông qua OrderStateMachine để kiểm thử toàn diện luồng nghiệp vụ mà không cần đơn vị vận chuyển thật.
 * Tuân thủ quy chuẩn ARCHITECTURE.md 2.3.4 và CODE_PRINCIPLES.md.
 */
public class ShippingSimulationWorker {

    private static final Logger log = LoggerFactory.getLogger(ShippingSimulationWorker.class);

    private final OrderDAO orderDAO;
    private final OrderStatusHistoryDAO orderStatusHistoryDAO;
    private final OrderStateMachine orderStateMachine;
    private final long defaultDelaySeconds;

    public ShippingSimulationWorker(
            OrderDAO orderDAO,
            OrderStatusHistoryDAO orderStatusHistoryDAO,
            OrderStateMachine orderStateMachine,
            long defaultDelaySeconds
    ) {
        this.orderDAO = Objects.requireNonNull(orderDAO, "orderDAO must not be null");
        this.orderStatusHistoryDAO = Objects.requireNonNull(orderStatusHistoryDAO, "orderStatusHistoryDAO must not be null");
        this.orderStateMachine = Objects.requireNonNull(orderStateMachine, "orderStateMachine must not be null");
        this.defaultDelaySeconds = Math.max(1L, defaultDelaySeconds);
    }

    public ShippingSimulationWorker(
            OrderDAO orderDAO,
            OrderStatusHistoryDAO orderStatusHistoryDAO,
            OrderStateMachine orderStateMachine
    ) {
        this(orderDAO, orderStatusHistoryDAO, orderStateMachine, readConfiguredDelaySeconds());
    }

    /**
     * Thực hiện một chu kỳ quét và tự động chuyển các đơn hàng SHIPPING đủ điều kiện sang DELIVERED.
     * @return Số lượng đơn hàng đã được cập nhật sang DELIVERED.
     */
    public int runSimulation() {
        return runSimulation(this.defaultDelaySeconds, false);
    }

    /**
     * Quét và chuyển trạng thái vận chuyển với cấu hình thời gian tùy chỉnh.
     * @param minSecondsInShipping Số giây tối thiểu đơn hàng ở trạng thái SHIPPING trước khi giao thành công.
     * @param forceAll Nếu true, chuyển tất cả đơn đang SHIPPING sang DELIVERED ngay lập tức mà không chờ thời gian trôi qua.
     * @return Số lượng đơn hàng đã được cập nhật thành công.
     */
    public int runSimulation(long minSecondsInShipping, boolean forceAll) {
        LocalDateTime now = LocalDateTime.now();
        List<OrderEntity> shippingOrders = orderDAO.findByStatus(OrderStatus.SHIPPING, 50);

        if (shippingOrders == null || shippingOrders.isEmpty()) {
            return 0;
        }

        log.debug("Found {} order(s) in SHIPPING status for delivery simulation.", shippingOrders.size());
        int deliveredCount = 0;

        for (OrderEntity order : shippingOrders) {
            try {
                boolean shouldDeliver = false;

                if (forceAll) {
                    shouldDeliver = true;
                } else {
                    LocalDateTime enteredShippingAt = orderStatusHistoryDAO
                            .findLatestHistoryByOrderIdAndToStatus(order.getId(), OrderStatus.SHIPPING)
                            .map(OrderStatusHistoryEntity::getCreatedAt)
                            .orElse(order.getOrderDate());

                    if (enteredShippingAt != null && !now.isBefore(enteredShippingAt.plusSeconds(minSecondsInShipping))) {
                        shouldDeliver = true;
                    }
                }

                if (shouldDeliver) {
                    orderStateMachine.transition(
                            order,
                            OrderStatus.DELIVERED,
                            OrderActorType.SYSTEM,
                            "SHIPPING_SIMULATION_JOB",
                            "Giao hàng thành công (Mô phỏng vận chuyển tự động)"
                    );
                    deliveredCount++;
                    log.info("Order [{}] successfully simulated delivery from SHIPPING to DELIVERED.", order.getOrderCode());
                }
            } catch (Exception e) {
                // Exception shielding: 1 đơn hàng gặp lỗi không làm dừng tiến trình của các đơn hàng khác
                log.error("Failed to simulate delivery for order [{}]: {}", order.getOrderCode(), e.getMessage(), e);
            }
        }

        if (deliveredCount > 0) {
            log.info("ShippingSimulationWorker completed: transitioned {}/{} orders to DELIVERED.",
                    deliveredCount, shippingOrders.size());
        }

        return deliveredCount;
    }

    public long getDefaultDelaySeconds() {
        return defaultDelaySeconds;
    }

    private static long readConfiguredDelaySeconds() {
        String envVal = System.getenv("SHIPPING_SIMULATION_DELAY_SECONDS");
        if (envVal != null && !envVal.isBlank()) {
            try {
                return Long.parseLong(envVal.trim());
            } catch (NumberFormatException ignored) {}
        }

        String propVal = System.getProperty("app.shipping.simulation.delaySeconds");
        if (propVal != null && !propVal.isBlank()) {
            try {
                return Long.parseLong(propVal.trim());
            } catch (NumberFormatException ignored) {}
        }

        return 60L; // Mặc định 60 giây cho môi trường kiểm thử/demo
    }
}
