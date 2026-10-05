package com.example.webchicken.modules.order.policy;

import com.example.webchicken.common.enums.OrderStatus;
import com.example.webchicken.common.enums.PaymentStatus;
import com.example.webchicken.common.exception.IllegalOrderStateTransitionException;
import com.example.webchicken.modules.inventory.service.InventoryService;
import com.example.webchicken.modules.order.dao.OrderDAO;
import com.example.webchicken.modules.order.dao.OrderStatusHistoryDAO;
import com.example.webchicken.modules.order.model.entity.OrderEntity;
import com.example.webchicken.modules.order.model.entity.OrderStatusHistoryEntity;
import com.example.webchicken.modules.order.model.enums.OrderActorType;
import com.example.webchicken.modules.order.model.enums.PaymentMethod;
import com.example.webchicken.modules.payment.dao.PaymentDAO;
import com.example.webchicken.modules.payment.model.entity.PaymentEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.*;

/**
 * State Machine quản lý chuyển đổi trạng thái Đơn hàng (TASK-54).
 * Single Source of Truth cho vòng đời đơn hàng:
 * PENDING → CONFIRMED → SHIPPING → DELIVERED; nhánh phụ: CANCELLED, RETURNED.
 * Tuân thủ nghiêm ngặt ARCHITECTURE.md 2.3.4.
 */
public class OrderStateMachine {

    private static final Logger log = LoggerFactory.getLogger(OrderStateMachine.class);

    private final OrderDAO orderDAO;
    private final OrderStatusHistoryDAO orderStatusHistoryDAO;
    private final InventoryService inventoryService;
    private final PaymentDAO paymentDAO;

    public OrderStateMachine(
            OrderDAO orderDAO,
            OrderStatusHistoryDAO orderStatusHistoryDAO,
            InventoryService inventoryService,
            PaymentDAO paymentDAO
    ) {
        this.orderDAO = Objects.requireNonNull(orderDAO, "orderDAO must not be null");
        this.orderStatusHistoryDAO = Objects.requireNonNull(orderStatusHistoryDAO, "orderStatusHistoryDAO must not be null");
        this.inventoryService = inventoryService;
        this.paymentDAO = paymentDAO;
    }

    /**
     * Chuyển trạng thái đơn hàng có kiểm soát bảo mật, phân quyền tác nhân, ghi nhật ký và thực thi tác vụ phụ.
     * Thao tác đảm bảo tính Idempotent: gọi lại cùng trạng thái hiện tại sẽ trả về thành công an toàn.
     */
    public synchronized void transition(OrderEntity order, OrderStatus targetStatus, OrderActorType actorType, String actorId, String reason) {
        if (order == null) {
            throw new IllegalArgumentException("Order entity cannot be null");
        }
        if (targetStatus == null) {
            throw new IllegalArgumentException("Target order status cannot be null");
        }
        if (actorType == null) {
            throw new IllegalArgumentException("Actor type cannot be null");
        }

        OrderStatus currentStatus = order.getStatus();

        // 1. Idempotency Check: nếu trạng thái hiện tại đã là trạng thái mục tiêu thì bỏ qua, không chạy lại side effects
        if (currentStatus == targetStatus) {
            log.info("Order [{}] is already in status [{}]. Idempotent call accepted.", order.getOrderCode(), targetStatus);
            return;
        }

        // 2. Kiểm tra tính hợp lệ của bước chuyển đổi (State Transition Guard)
        if (!isValidTransition(currentStatus, targetStatus)) {
            String errorMsg = String.format("Illegal state transition for order [%s]: cannot move from [%s] to [%s].",
                    order.getOrderCode(), currentStatus, targetStatus);
            log.warn(errorMsg);
            throw new IllegalOrderStateTransitionException(errorMsg);
        }

        // 3. Kiểm tra quyền của tác nhân (Actor Authorization Guard)
        if (!isActorAllowed(currentStatus, targetStatus, actorType)) {
            String errorMsg = String.format("Actor [%s] is not permitted to transition order [%s] from [%s] to [%s].",
                    actorType, order.getOrderCode(), currentStatus, targetStatus);
            log.warn(errorMsg);
            throw new IllegalOrderStateTransitionException(errorMsg);
        }

        // 4. Thực thi các tác vụ phụ (Side Effects) tương ứng với từng bước chuyển đổi
        executeSideEffects(order, currentStatus, targetStatus);

        // 5. Cập nhật trạng thái đơn hàng trong Database và trong Entity
        orderDAO.updateStatus(order.getId(), targetStatus);
        order.setStatus(targetStatus);

        // 6. Ghi nhật ký vào Sổ cái Audit Trail (order_status_histories)
        String historyId = UUID.randomUUID().toString();
        OrderStatusHistoryEntity history = new OrderStatusHistoryEntity(
                historyId,
                order.getId(),
                currentStatus,
                targetStatus,
                actorType,
                actorId,
                reason
        );
        orderStatusHistoryDAO.save(history);

        log.info("Successfully transitioned order [{}] from [{}] to [{}] by actor [{}:{}]. Reason: {}",
                order.getOrderCode(), currentStatus, targetStatus, actorType, actorId, reason);
    }

    /**
     * Kiểm tra chuyển đổi trạng thái có hợp lệ theo mô hình state machine không.
     */
    public boolean isValidTransition(OrderStatus from, OrderStatus to) {
        if (from == null || to == null) return false;
        return switch (from) {
            case PENDING -> (to == OrderStatus.CONFIRMED || to == OrderStatus.CANCELLED);
            case CONFIRMED -> (to == OrderStatus.SHIPPING || to == OrderStatus.CANCELLED);
            case SHIPPING -> (to == OrderStatus.DELIVERED);
            case DELIVERED -> (to == OrderStatus.RETURNED);
            case CANCELLED, RETURNED -> false; // Terminal states
        };
    }

    /**
     * Kiểm tra tác nhân có thẩm quyền kích hoạt bước chuyển đổi này không.
     */
    public boolean isActorAllowed(OrderStatus from, OrderStatus to, OrderActorType actorType) {
        if (actorType == OrderActorType.ADMIN) {
            return true; // Admin có toàn quyền điều phối trong phạm vi chuyển đổi hợp lệ
        }

        if (actorType == OrderActorType.CUSTOMER) {
            // Khách hàng chỉ được hủy đơn (ở PENDING / CONFIRMED) hoặc yêu cầu trả hàng (ở DELIVERED)
            return (from == OrderStatus.PENDING && to == OrderStatus.CANCELLED)
                    || (from == OrderStatus.CONFIRMED && to == OrderStatus.CANCELLED)
                    || (from == OrderStatus.DELIVERED && to == OrderStatus.RETURNED);
        }

        if (actorType == OrderActorType.SELLER) {
            // Seller xác nhận, giao hàng, hoàn tất giao hoặc hủy khi không đủ hàng
            return (from == OrderStatus.PENDING && to == OrderStatus.CONFIRMED)
                    || (from == OrderStatus.CONFIRMED && to == OrderStatus.SHIPPING)
                    || (from == OrderStatus.SHIPPING && to == OrderStatus.DELIVERED)
                    || (from == OrderStatus.PENDING && to == OrderStatus.CANCELLED)
                    || (from == OrderStatus.CONFIRMED && to == OrderStatus.CANCELLED);
        }

        if (actorType == OrderActorType.SYSTEM) {
            // Hệ thống (IPN payment webhook, worker tự động hủy quá hạn, carrier delivery webhook)
            return (from == OrderStatus.PENDING && to == OrderStatus.CONFIRMED)
                    || (from == OrderStatus.PENDING && to == OrderStatus.CANCELLED)
                    || (from == OrderStatus.CONFIRMED && to == OrderStatus.SHIPPING)
                    || (from == OrderStatus.SHIPPING && to == OrderStatus.DELIVERED);
        }

        return false;
    }

    /**
     * Danh sách các trạng thái tiếp theo hợp lệ từ trạng thái hiện tại cho tác nhân.
     */
    public Set<OrderStatus> getNextAllowedStatuses(OrderStatus current, OrderActorType actorType) {
        if (current == null) return Collections.emptySet();
        Set<OrderStatus> allowed = new HashSet<>();
        for (OrderStatus candidate : OrderStatus.values()) {
            if (isValidTransition(current, candidate) && isActorAllowed(current, candidate, actorType)) {
                allowed.add(candidate);
            }
        }
        return allowed;
    }

    /**
     * Thực thi các tác vụ phụ (Side effects) độc lập theo kiến trúc Clean Architecture:
     * - Quản lý tồn kho giữ chỗ (Commit / Release)
     * - Đồng bộ trạng thái thanh toán (PAID khi COD giao thành công, REFUNDED khi hoàn/hủy)
     */
    private void executeSideEffects(OrderEntity order, OrderStatus from, OrderStatus to) {
        // Tác vụ tồn kho
        if (to == OrderStatus.CONFIRMED) {
            if (inventoryService != null) {
                inventoryService.commitReservationByOrder(order.getId());
            }
        } else if (to == OrderStatus.CANCELLED) {
            if (inventoryService != null) {
                inventoryService.releaseReservationByOrder(order.getId());
            }
            handlePaymentOnCancellation(order);
        } else if (to == OrderStatus.DELIVERED) {
            handlePaymentOnDelivered(order);
        } else if (to == OrderStatus.RETURNED) {
            handlePaymentOnReturned(order);
        }
    }

    private void handlePaymentOnCancellation(OrderEntity order) {
        if (paymentDAO == null) return;
        Optional<PaymentEntity> paymentOpt = paymentDAO.findByOrderId(order.getId());
        if (paymentOpt.isPresent()) {
            PaymentEntity payment = paymentOpt.get();
            if (payment.getStatus() == PaymentStatus.UNPAID) {
                payment.setStatus(PaymentStatus.FAILED);
                paymentDAO.update(payment);
                orderDAO.updatePaymentStatus(order.getId(), PaymentStatus.FAILED);
                order.setPaymentStatus(PaymentStatus.FAILED);
            } else if (payment.getStatus() == PaymentStatus.PAID) {
                // Đã thanh toán trực tuyến nhưng hủy đơn trước khi giao -> đánh dấu REFUNDED
                payment.setStatus(PaymentStatus.REFUNDED);
                paymentDAO.update(payment);
                orderDAO.updatePaymentStatus(order.getId(), PaymentStatus.REFUNDED);
                order.setPaymentStatus(PaymentStatus.REFUNDED);
            }
        }
    }

    private void handlePaymentOnDelivered(OrderEntity order) {
        if (order.getPaymentMethod() == PaymentMethod.COD && order.getPaymentStatus() == PaymentStatus.UNPAID) {
            if (paymentDAO != null) {
                Optional<PaymentEntity> paymentOpt = paymentDAO.findByOrderId(order.getId());
                if (paymentOpt.isPresent()) {
                    PaymentEntity payment = paymentOpt.get();
                    payment.setStatus(PaymentStatus.PAID);
                    payment.setPaidAt(LocalDateTime.now());
                    paymentDAO.update(payment);
                }
            }
            orderDAO.updatePaymentStatus(order.getId(), PaymentStatus.PAID);
            order.setPaymentStatus(PaymentStatus.PAID);
            log.info("COD Order [{}] marked as PAID upon successful delivery.", order.getOrderCode());
        }
    }

    private void handlePaymentOnReturned(OrderEntity order) {
        if (paymentDAO != null) {
            Optional<PaymentEntity> paymentOpt = paymentDAO.findByOrderId(order.getId());
            if (paymentOpt.isPresent()) {
                PaymentEntity payment = paymentOpt.get();
                payment.setStatus(PaymentStatus.REFUNDED);
                paymentDAO.update(payment);
            }
        }
        orderDAO.updatePaymentStatus(order.getId(), PaymentStatus.REFUNDED);
        order.setPaymentStatus(PaymentStatus.REFUNDED);
        log.info("Order [{}] payment marked as REFUNDED upon customer return.", order.getOrderCode());
    }
}
