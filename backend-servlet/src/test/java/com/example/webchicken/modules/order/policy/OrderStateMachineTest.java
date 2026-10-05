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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

public class OrderStateMachineTest {

    private OrderDAO orderDAO;
    private OrderStatusHistoryDAO orderStatusHistoryDAO;
    private InventoryService inventoryService;
    private PaymentDAO paymentDAO;
    private OrderStateMachine stateMachine;

    private OrderEntity sampleOrder;

    @BeforeEach
    void setUp() {
        orderDAO = mock(OrderDAO.class);
        orderStatusHistoryDAO = mock(OrderStatusHistoryDAO.class);
        inventoryService = mock(InventoryService.class);
        paymentDAO = mock(PaymentDAO.class);

        stateMachine = new OrderStateMachine(orderDAO, orderStatusHistoryDAO, inventoryService, paymentDAO);

        sampleOrder = new OrderEntity();
        sampleOrder.setId("ord-uuid-001");
        sampleOrder.setOrderCode("ORD-20261004-100001");
        sampleOrder.setCustomerId("cust-001");
        sampleOrder.setStatus(OrderStatus.PENDING);
        sampleOrder.setPaymentStatus(PaymentStatus.UNPAID);
        sampleOrder.setPaymentMethod(PaymentMethod.COD);
    }

    @Test
    @DisplayName("Should successfully transition PENDING -> CONFIRMED and commit stock reservation")
    void testTransition_PendingToConfirmed_Success() {
        stateMachine.transition(sampleOrder, OrderStatus.CONFIRMED, OrderActorType.SELLER, "seller-123", "Shop confirmed order");

        assertEquals(OrderStatus.CONFIRMED, sampleOrder.getStatus());
        verify(orderDAO).updateStatus("ord-uuid-001", OrderStatus.CONFIRMED);
        verify(inventoryService).commitReservationByOrder("ord-uuid-001");

        ArgumentCaptor<OrderStatusHistoryEntity> historyCaptor = ArgumentCaptor.forClass(OrderStatusHistoryEntity.class);
        verify(orderStatusHistoryDAO).save(historyCaptor.capture());
        OrderStatusHistoryEntity savedHistory = historyCaptor.getValue();

        assertEquals("ord-uuid-001", savedHistory.getOrderId());
        assertEquals(OrderStatus.PENDING, savedHistory.getFromStatus());
        assertEquals(OrderStatus.CONFIRMED, savedHistory.getToStatus());
        assertEquals(OrderActorType.SELLER, savedHistory.getActorType());
        assertEquals("seller-123", savedHistory.getActorId());
    }

    @Test
    @DisplayName("Should successfully transition CONFIRMED -> SHIPPING")
    void testTransition_ConfirmedToShipping_Success() {
        sampleOrder.setStatus(OrderStatus.CONFIRMED);

        stateMachine.transition(sampleOrder, OrderStatus.SHIPPING, OrderActorType.SELLER, "seller-123", "Dispatched to carrier");

        assertEquals(OrderStatus.SHIPPING, sampleOrder.getStatus());
        verify(orderDAO).updateStatus("ord-uuid-001", OrderStatus.SHIPPING);
        verify(orderStatusHistoryDAO).save(any(OrderStatusHistoryEntity.class));
    }

    @Test
    @DisplayName("Should transition SHIPPING -> DELIVERED and mark COD payment as PAID")
    void testTransition_ShippingToDelivered_COD_MarksPaid() {
        sampleOrder.setStatus(OrderStatus.SHIPPING);
        sampleOrder.setPaymentMethod(PaymentMethod.COD);
        sampleOrder.setPaymentStatus(PaymentStatus.UNPAID);

        PaymentEntity payment = new PaymentEntity();
        payment.setId("pay-001");
        payment.setOrderId("ord-uuid-001");
        payment.setStatus(PaymentStatus.UNPAID);
        when(paymentDAO.findByOrderId("ord-uuid-001")).thenReturn(Optional.of(payment));

        stateMachine.transition(sampleOrder, OrderStatus.DELIVERED, OrderActorType.SYSTEM, "CARRIER", "Delivered successfully");

        assertEquals(OrderStatus.DELIVERED, sampleOrder.getStatus());
        assertEquals(PaymentStatus.PAID, sampleOrder.getPaymentStatus());
        assertEquals(PaymentStatus.PAID, payment.getStatus());
        verify(paymentDAO).update(payment);
        verify(orderDAO).updatePaymentStatus("ord-uuid-001", PaymentStatus.PAID);
        verify(orderDAO).updateStatus("ord-uuid-001", OrderStatus.DELIVERED);
    }

    @Test
    @DisplayName("Should transition PENDING -> CANCELLED by Customer and release stock reservation")
    void testTransition_PendingToCancelled_ReleasesReservation() {
        PaymentEntity payment = new PaymentEntity();
        payment.setId("pay-001");
        payment.setStatus(PaymentStatus.UNPAID);
        when(paymentDAO.findByOrderId("ord-uuid-001")).thenReturn(Optional.of(payment));

        stateMachine.transition(sampleOrder, OrderStatus.CANCELLED, OrderActorType.CUSTOMER, "cust-001", "Changed my mind");

        assertEquals(OrderStatus.CANCELLED, sampleOrder.getStatus());
        assertEquals(PaymentStatus.FAILED, sampleOrder.getPaymentStatus());
        verify(inventoryService).releaseReservationByOrder("ord-uuid-001");
        verify(orderDAO).updateStatus("ord-uuid-001", OrderStatus.CANCELLED);
        verify(paymentDAO).update(payment);
    }

    @Test
    @DisplayName("Should transition CONFIRMED -> CANCELLED by Admin and refund paid payment")
    void testTransition_ConfirmedToCancelled_PaidOrder_RefundsPayment() {
        sampleOrder.setStatus(OrderStatus.CONFIRMED);
        sampleOrder.setPaymentStatus(PaymentStatus.PAID);

        PaymentEntity payment = new PaymentEntity();
        payment.setId("pay-001");
        payment.setStatus(PaymentStatus.PAID);
        when(paymentDAO.findByOrderId("ord-uuid-001")).thenReturn(Optional.of(payment));

        stateMachine.transition(sampleOrder, OrderStatus.CANCELLED, OrderActorType.ADMIN, "admin-001", "Item damaged in warehouse");

        assertEquals(OrderStatus.CANCELLED, sampleOrder.getStatus());
        assertEquals(PaymentStatus.REFUNDED, sampleOrder.getPaymentStatus());
        assertEquals(PaymentStatus.REFUNDED, payment.getStatus());
        verify(inventoryService).releaseReservationByOrder("ord-uuid-001");
        verify(paymentDAO).update(payment);
    }

    @Test
    @DisplayName("Should transition DELIVERED -> RETURNED by Customer and refund payment")
    void testTransition_DeliveredToReturned_Success() {
        sampleOrder.setStatus(OrderStatus.DELIVERED);
        sampleOrder.setPaymentStatus(PaymentStatus.PAID);

        PaymentEntity payment = new PaymentEntity();
        payment.setId("pay-001");
        payment.setStatus(PaymentStatus.PAID);
        when(paymentDAO.findByOrderId("ord-uuid-001")).thenReturn(Optional.of(payment));

        stateMachine.transition(sampleOrder, OrderStatus.RETURNED, OrderActorType.CUSTOMER, "cust-001", "Product defective");

        assertEquals(OrderStatus.RETURNED, sampleOrder.getStatus());
        assertEquals(PaymentStatus.REFUNDED, sampleOrder.getPaymentStatus());
        verify(orderDAO).updateStatus("ord-uuid-001", OrderStatus.RETURNED);
    }

    @Test
    @DisplayName("Should throw 409 IllegalOrderStateTransitionException when cancelling an order in SHIPPING status")
    void testTransition_ShippingToCancelled_Throws409() {
        sampleOrder.setStatus(OrderStatus.SHIPPING);

        IllegalOrderStateTransitionException ex = assertThrows(
                IllegalOrderStateTransitionException.class,
                () -> stateMachine.transition(sampleOrder, OrderStatus.CANCELLED, OrderActorType.CUSTOMER, "cust-001", "Too late to cancel")
        );

        assertTrue(ex.getMessage().contains("Illegal state transition"));
        assertEquals(409, ex.getHttpStatus());
        verify(orderDAO, never()).updateStatus(any(), any());
        verify(inventoryService, never()).releaseReservationByOrder(any());
        verify(orderStatusHistoryDAO, never()).save(any());
    }

    @Test
    @DisplayName("Should throw 409 IllegalOrderStateTransitionException when transitioning from terminal CANCELLED state")
    void testTransition_CancelledToConfirmed_Throws409() {
        sampleOrder.setStatus(OrderStatus.CANCELLED);

        assertThrows(
                IllegalOrderStateTransitionException.class,
                () -> stateMachine.transition(sampleOrder, OrderStatus.CONFIRMED, OrderActorType.SELLER, "seller-001", "Reactivate order")
        );

        verify(orderDAO, never()).updateStatus(any(), any());
    }

    @Test
    @DisplayName("Should throw 409 when Customer attempts unauthorized transition (e.g. PENDING -> CONFIRMED)")
    void testTransition_CustomerUnauthorized_Throws409() {
        IllegalOrderStateTransitionException ex = assertThrows(
                IllegalOrderStateTransitionException.class,
                () -> stateMachine.transition(sampleOrder, OrderStatus.CONFIRMED, OrderActorType.CUSTOMER, "cust-001", "Customer confirms own order")
        );

        assertTrue(ex.getMessage().contains("is not permitted to transition"));
        verify(orderDAO, never()).updateStatus(any(), any());
    }

    @Test
    @DisplayName("Idempotency: Transitioning to the current state should do nothing and not trigger duplicate side effects")
    void testTransition_IdempotentCall_DoesNothing() {
        sampleOrder.setStatus(OrderStatus.CONFIRMED);

        stateMachine.transition(sampleOrder, OrderStatus.CONFIRMED, OrderActorType.SELLER, "seller-001", "Repeated confirmation");

        assertEquals(OrderStatus.CONFIRMED, sampleOrder.getStatus());
        verify(orderDAO, never()).updateStatus(any(), any());
        verify(inventoryService, never()).commitReservationByOrder(any());
        verify(orderStatusHistoryDAO, never()).save(any());
    }
}
