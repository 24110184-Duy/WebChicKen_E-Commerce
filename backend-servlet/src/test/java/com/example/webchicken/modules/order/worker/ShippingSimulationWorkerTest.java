package com.example.webchicken.modules.order.worker;

import com.example.webchicken.common.enums.OrderStatus;
import com.example.webchicken.modules.order.dao.OrderDAO;
import com.example.webchicken.modules.order.dao.OrderStatusHistoryDAO;
import com.example.webchicken.modules.order.model.entity.OrderEntity;
import com.example.webchicken.modules.order.model.entity.OrderStatusHistoryEntity;
import com.example.webchicken.modules.order.model.enums.OrderActorType;
import com.example.webchicken.modules.order.policy.OrderStateMachine;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

public class ShippingSimulationWorkerTest {

    private OrderDAO orderDAO;
    private OrderStatusHistoryDAO orderStatusHistoryDAO;
    private OrderStateMachine orderStateMachine;
    private ShippingSimulationWorker worker;

    @BeforeEach
    void setUp() {
        orderDAO = mock(OrderDAO.class);
        orderStatusHistoryDAO = mock(OrderStatusHistoryDAO.class);
        orderStateMachine = mock(OrderStateMachine.class);
        worker = new ShippingSimulationWorker(orderDAO, orderStatusHistoryDAO, orderStateMachine, 60L);
    }

    @Test
    @DisplayName("Không có đơn hàng nào ở trạng thái SHIPPING -> trả về 0")
    void testRunSimulation_NoOrders_ReturnsZero() {
        when(orderDAO.findByStatus(OrderStatus.SHIPPING, 50)).thenReturn(List.of());

        int count = worker.runSimulation();

        assertEquals(0, count);
        verify(orderStateMachine, never()).transition(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Đơn hàng SHIPPING đã đủ thời gian giả lập (>60s) -> tự động chuyển sang DELIVERED")
    void testRunSimulation_OrderDurationElapsed_TransitionsToDelivered() {
        OrderEntity order = new OrderEntity();
        order.setId("order-ship-1");
        order.setOrderCode("ORD-20261007-001");
        order.setStatus(OrderStatus.SHIPPING);

        OrderStatusHistoryEntity history = new OrderStatusHistoryEntity();
        history.setId("hist-1");
        history.setOrderId("order-ship-1");
        history.setToStatus(OrderStatus.SHIPPING);
        history.setCreatedAt(LocalDateTime.now().minusSeconds(120)); // Đã ship 120s trước

        when(orderDAO.findByStatus(OrderStatus.SHIPPING, 50)).thenReturn(List.of(order));
        when(orderStatusHistoryDAO.findLatestHistoryByOrderIdAndToStatus("order-ship-1", OrderStatus.SHIPPING))
                .thenReturn(Optional.of(history));

        int count = worker.runSimulation();

        assertEquals(1, count);
        verify(orderStateMachine, times(1)).transition(
                eq(order),
                eq(OrderStatus.DELIVERED),
                eq(OrderActorType.SYSTEM),
                eq("SHIPPING_SIMULATION_JOB"),
                contains("Giao hàng thành công")
        );
    }

    @Test
    @DisplayName("Đơn hàng SHIPPING chưa đủ thời gian giả lập (<60s) -> không chuyển trạng thái")
    void testRunSimulation_OrderDurationNotElapsed_DoesNotTransition() {
        OrderEntity order = new OrderEntity();
        order.setId("order-ship-2");
        order.setOrderCode("ORD-20261007-002");
        order.setStatus(OrderStatus.SHIPPING);

        OrderStatusHistoryEntity history = new OrderStatusHistoryEntity();
        history.setId("hist-2");
        history.setOrderId("order-ship-2");
        history.setToStatus(OrderStatus.SHIPPING);
        history.setCreatedAt(LocalDateTime.now().minusSeconds(10)); // Vừa mới ship 10s trước

        when(orderDAO.findByStatus(OrderStatus.SHIPPING, 50)).thenReturn(List.of(order));
        when(orderStatusHistoryDAO.findLatestHistoryByOrderIdAndToStatus("order-ship-2", OrderStatus.SHIPPING))
                .thenReturn(Optional.of(history));

        int count = worker.runSimulation();

        assertEquals(0, count);
        verify(orderStateMachine, never()).transition(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Chế độ forceAll=true -> chuyển DELIVERED ngay lập tức không cần chờ thời gian giả lập")
    void testRunSimulation_ForceAll_TransitionsImmediately() {
        OrderEntity order = new OrderEntity();
        order.setId("order-ship-3");
        order.setOrderCode("ORD-20261007-003");
        order.setStatus(OrderStatus.SHIPPING);

        when(orderDAO.findByStatus(OrderStatus.SHIPPING, 50)).thenReturn(List.of(order));

        int count = worker.runSimulation(60L, true);

        assertEquals(1, count);
        verify(orderStateMachine, times(1)).transition(
                eq(order),
                eq(OrderStatus.DELIVERED),
                eq(OrderActorType.SYSTEM),
                eq("SHIPPING_SIMULATION_JOB"),
                any()
        );
    }

    @Test
    @DisplayName("Không tìm thấy history -> dùng orderDate để đối soát thời gian")
    void testRunSimulation_FallbackToOrderDate_WhenNoHistory() {
        OrderEntity order = new OrderEntity();
        order.setId("order-ship-4");
        order.setOrderCode("ORD-20261007-004");
        order.setStatus(OrderStatus.SHIPPING);
        order.setOrderDate(LocalDateTime.now().minusMinutes(5)); // Order date 5 phút trước

        when(orderDAO.findByStatus(OrderStatus.SHIPPING, 50)).thenReturn(List.of(order));
        when(orderStatusHistoryDAO.findLatestHistoryByOrderIdAndToStatus("order-ship-4", OrderStatus.SHIPPING))
                .thenReturn(Optional.empty());

        int count = worker.runSimulation();

        assertEquals(1, count);
        verify(orderStateMachine, times(1)).transition(
                eq(order),
                eq(OrderStatus.DELIVERED),
                eq(OrderActorType.SYSTEM),
                eq("SHIPPING_SIMULATION_JOB"),
                any()
        );
    }

    @Test
    @DisplayName("Lỗi ở 1 đơn hàng không làm gián đoạn việc xử lý các đơn hàng tiếp theo (Exception Shielding)")
    void testRunSimulation_ExceptionShielding() {
        OrderEntity badOrder = new OrderEntity();
        badOrder.setId("bad-order");
        badOrder.setOrderCode("ORD-BAD");
        badOrder.setStatus(OrderStatus.SHIPPING);

        OrderEntity goodOrder = new OrderEntity();
        goodOrder.setId("good-order");
        goodOrder.setOrderCode("ORD-GOOD");
        goodOrder.setStatus(OrderStatus.SHIPPING);

        when(orderDAO.findByStatus(OrderStatus.SHIPPING, 50)).thenReturn(List.of(badOrder, goodOrder));

        // badOrder ném lỗi khi transition
        doThrow(new RuntimeException("Simulated transition error"))
                .when(orderStateMachine)
                .transition(eq(badOrder), eq(OrderStatus.DELIVERED), any(), any(), any());

        int count = worker.runSimulation(0L, true);

        // goodOrder vẫn được xử lý thành công
        assertEquals(1, count);
        verify(orderStateMachine, times(1)).transition(eq(goodOrder), eq(OrderStatus.DELIVERED), any(), any(), any());
    }
}
