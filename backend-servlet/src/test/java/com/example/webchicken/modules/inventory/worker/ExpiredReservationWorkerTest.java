package com.example.webchicken.modules.inventory.worker;

import com.example.webchicken.common.enums.OrderStatus;
import com.example.webchicken.modules.inventory.dao.InventoryDAO;
import com.example.webchicken.modules.inventory.model.entity.StockReservationEntity;
import com.example.webchicken.modules.inventory.model.enums.ReservationStatus;
import com.example.webchicken.modules.order.dao.OrderDAO;
import com.example.webchicken.modules.order.model.entity.OrderEntity;
import com.example.webchicken.modules.order.model.enums.OrderActorType;
import com.example.webchicken.modules.order.policy.OrderStateMachine;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

public class ExpiredReservationWorkerTest {

    private InventoryDAO inventoryDAO;
    private OrderDAO orderDAO;
    private OrderStateMachine orderStateMachine;
    private ExpiredReservationWorker worker;

    @BeforeEach
    void setUp() {
        inventoryDAO = mock(InventoryDAO.class);
        orderDAO = mock(OrderDAO.class);
        orderStateMachine = mock(OrderStateMachine.class);
        worker = new ExpiredReservationWorker(inventoryDAO, orderDAO, orderStateMachine);
    }

    @Test
    @DisplayName("Should release stock and mark reservation as EXPIRED for expired active reservations")
    void testRunCleanup_WithExpiredReservations_ReleasesStockAndExpiresReservation() {
        StockReservationEntity reservation = new StockReservationEntity(
                "res-001",
                "sku-chicken-001",
                3,
                null,
                LocalDateTime.now().minusMinutes(5)
        );
        reservation.setStatus(ReservationStatus.ACTIVE);

        when(inventoryDAO.findExpiredActiveReservations(any())).thenReturn(List.of(reservation));

        int cleanedCount = worker.runCleanup();

        assertEquals(1, cleanedCount);
        verify(inventoryDAO).releaseStockAtomic("sku-chicken-001", 3);
        assertEquals(ReservationStatus.EXPIRED, reservation.getStatus());
        verify(inventoryDAO).updateReservation(reservation);
    }

    @Test
    @DisplayName("Should automatically cancel pending order via OrderStateMachine when reservation expires")
    void testRunCleanup_WithPendingOrder_CancelsOrderViaStateMachine() {
        StockReservationEntity reservation = new StockReservationEntity(
                "res-002",
                "sku-chicken-002",
                2,
                "ord-002",
                LocalDateTime.now().minusMinutes(10)
        );
        reservation.setStatus(ReservationStatus.ACTIVE);

        OrderEntity pendingOrder = new OrderEntity();
        pendingOrder.setId("ord-002");
        pendingOrder.setOrderCode("ORD-20261004-888888");
        pendingOrder.setStatus(OrderStatus.PENDING);

        when(inventoryDAO.findExpiredActiveReservations(any())).thenReturn(List.of(reservation));
        when(orderDAO.findById("ord-002")).thenReturn(Optional.of(pendingOrder));

        int cleanedCount = worker.runCleanup();

        assertEquals(1, cleanedCount);
        verify(inventoryDAO).releaseStockAtomic("sku-chicken-002", 2);
        verify(orderStateMachine).transition(
                eq(pendingOrder),
                eq(OrderStatus.CANCELLED),
                eq(OrderActorType.SYSTEM),
                eq("RESERVATION_WORKER"),
                eq("Stock reservation TTL expired (payment timeout)")
        );
    }

    @Test
    @DisplayName("Should NOT cancel order if order is already CONFIRMED or PAID")
    void testRunCleanup_WithConfirmedOrder_DoesNotCancelOrder() {
        StockReservationEntity reservation = new StockReservationEntity(
                "res-003",
                "sku-chicken-003",
                1,
                "ord-003",
                LocalDateTime.now().minusMinutes(1)
        );
        reservation.setStatus(ReservationStatus.ACTIVE);

        OrderEntity confirmedOrder = new OrderEntity();
        confirmedOrder.setId("ord-003");
        confirmedOrder.setOrderCode("ORD-20261004-777777");
        confirmedOrder.setStatus(OrderStatus.CONFIRMED);

        when(inventoryDAO.findExpiredActiveReservations(any())).thenReturn(List.of(reservation));
        when(orderDAO.findById("ord-003")).thenReturn(Optional.of(confirmedOrder));

        int cleanedCount = worker.runCleanup();

        assertEquals(1, cleanedCount);
        verify(inventoryDAO).releaseStockAtomic("sku-chicken-003", 1);
        verify(orderStateMachine, never()).transition(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Exception Shielding: One failing reservation should not abort cleanup of remaining reservations")
    void testRunCleanup_ExceptionShielding_OneFailureDoesNotAbortOthers() {
        StockReservationEntity failingRes = new StockReservationEntity(
                "res-fail",
                "sku-fail",
                5,
                null,
                LocalDateTime.now().minusMinutes(20)
        );
        failingRes.setStatus(ReservationStatus.ACTIVE);

        StockReservationEntity successfulRes = new StockReservationEntity(
                "res-success",
                "sku-success",
                2,
                null,
                LocalDateTime.now().minusMinutes(20)
        );
        successfulRes.setStatus(ReservationStatus.ACTIVE);

        when(inventoryDAO.findExpiredActiveReservations(any())).thenReturn(List.of(failingRes, successfulRes));
        doThrow(new RuntimeException("Database deadlock simulation"))
                .when(inventoryDAO).releaseStockAtomic("sku-fail", 5);

        int cleanedCount = worker.runCleanup();

        assertEquals(1, cleanedCount);
        verify(inventoryDAO).releaseStockAtomic("sku-success", 2);
        assertEquals(ReservationStatus.EXPIRED, successfulRes.getStatus());
        verify(inventoryDAO).updateReservation(successfulRes);
    }

    @Test
    @DisplayName("Should return 0 without performing actions when there are no expired reservations")
    void testRunCleanup_NoExpiredReservations_ReturnsZero() {
        when(inventoryDAO.findExpiredActiveReservations(any())).thenReturn(Collections.emptyList());

        int cleanedCount = worker.runCleanup();

        assertEquals(0, cleanedCount);
        verify(inventoryDAO, never()).releaseStockAtomic(any(), anyInt());
        verify(inventoryDAO, never()).updateReservation(any());
        verify(orderStateMachine, never()).transition(any(), any(), any(), any(), any());
    }
}
