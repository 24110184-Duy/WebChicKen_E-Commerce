package com.example.webchicken.modules.order.service;

import com.example.webchicken.common.enums.OrderStatus;
import com.example.webchicken.common.enums.PaymentStatus;
import com.example.webchicken.common.exception.NotFoundException;
import com.example.webchicken.common.exception.ValidationException;
import com.example.webchicken.modules.cart.dao.CartDAO;
import com.example.webchicken.modules.cart.dao.CartItemDAO;
import com.example.webchicken.modules.catalog.dao.ProductDAO;
import com.example.webchicken.modules.catalog.dao.ProductImageDAO;
import com.example.webchicken.modules.catalog.dao.ProductVariantDAO;
import com.example.webchicken.modules.inventory.service.InventoryService;
import com.example.webchicken.modules.order.dao.OrderCancellationDAO;
import com.example.webchicken.modules.order.dao.OrderDAO;
import com.example.webchicken.modules.order.dao.OrderItemDAO;
import com.example.webchicken.modules.order.dao.OrderStatusHistoryDAO;
import com.example.webchicken.modules.order.model.dto.response.OrderResponse;
import com.example.webchicken.modules.order.model.entity.OrderEntity;
import com.example.webchicken.modules.order.model.entity.OrderItemEntity;
import com.example.webchicken.modules.order.model.enums.PaymentMethod;
import com.example.webchicken.modules.order.policy.OrderStateMachine;
import com.example.webchicken.modules.order.service.impl.OrderServiceImpl;
import com.example.webchicken.modules.payment.dao.PaymentDAO;
import com.example.webchicken.modules.promotion.service.VoucherService;
import com.example.webchicken.modules.shop.dao.StoreDAO;
import com.example.webchicken.modules.shop.model.entity.StoreEntity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class OrderServiceImplSellerTest {

    private OrderDAO orderDAO;
    private OrderItemDAO orderItemDAO;
    private StoreDAO storeDAO;
    private OrderStatusHistoryDAO orderStatusHistoryDAO;
    private OrderStateMachine orderStateMachine;
    private OrderServiceImpl orderService;

    @BeforeEach
    void setUp() {
        orderDAO = mock(OrderDAO.class);
        orderItemDAO = mock(OrderItemDAO.class);
        OrderCancellationDAO orderCancellationDAO = mock(OrderCancellationDAO.class);
        CartDAO cartDAO = mock(CartDAO.class);
        CartItemDAO cartItemDAO = mock(CartItemDAO.class);
        ProductDAO productDAO = mock(ProductDAO.class);
        ProductVariantDAO productVariantDAO = mock(ProductVariantDAO.class);
        ProductImageDAO productImageDAO = mock(ProductImageDAO.class);
        storeDAO = mock(StoreDAO.class);
        InventoryService inventoryService = mock(InventoryService.class);
        VoucherService voucherService = mock(VoucherService.class);
        PaymentDAO paymentDAO = mock(PaymentDAO.class);
        orderStatusHistoryDAO = mock(OrderStatusHistoryDAO.class);

        orderStateMachine = new OrderStateMachine(orderDAO, orderStatusHistoryDAO, inventoryService, paymentDAO);

        orderService = new OrderServiceImpl(
                orderDAO, orderItemDAO, orderCancellationDAO,
                cartDAO, cartItemDAO, productDAO, productVariantDAO, productImageDAO,
                storeDAO, inventoryService, voucherService, null,
                orderStatusHistoryDAO, orderStateMachine
        );
    }

    @Test
    @DisplayName("getStoreOrders retrieves orders belonging to the store")
    void testGetStoreOrders() {
        String storeId = "store-1";
        OrderEntity order = new OrderEntity("ord-1", "ORD-20261004-0001", "grp-1", "cust-1", storeId,
                150000, 30000, 0, PaymentMethod.COD, "John Doe", "0901234567", "123 Farm Road", "Keep cool");
        order.setStatus(OrderStatus.PENDING);

        when(orderDAO.findByStoreId(storeId, OrderStatus.PENDING, 0, 10)).thenReturn(List.of(order));
        when(orderItemDAO.findByOrderId("ord-1")).thenReturn(List.of(
                new OrderItemEntity("item-1", "ord-1", "p-1", "v-1", "Ga Ta Tha Vuon", "1.5kg", "http://img.jpg", 1, 150000)
        ));
        StoreEntity store = new StoreEntity();
        store.setId(storeId);
        store.setStoreName("Fresh Poultry Farm");
        when(storeDAO.findById(storeId)).thenReturn(Optional.of(store));

        List<OrderResponse> results = orderService.getStoreOrders(storeId, OrderStatus.PENDING, 1, 10);

        assertEquals(1, results.size());
        assertEquals("ORD-20261004-0001", results.get(0).orderCode());
        assertEquals("Fresh Poultry Farm", results.get(0).storeName());
        assertEquals(1, results.get(0).items().size());
    }

    @Test
    @DisplayName("getStoreOrderByCode throws NotFoundException when order does not belong to store")
    void testGetStoreOrderByCodeMismatch() {
        String storeId = "store-1";
        when(orderDAO.findByOrderCodeAndStoreId("ORD-9999", storeId)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> orderService.getStoreOrderByCode("ORD-9999", storeId));
    }

    @Test
    @DisplayName("updateStoreOrderStatus transitions PENDING to CONFIRMED and CONFIRMED to SHIPPING")
    void testUpdateStoreOrderStatusTransitions() {
        String storeId = "store-1";
        OrderEntity order = new OrderEntity("ord-1", "ORD-20261004-0001", "grp-1", "cust-1", storeId,
                200000, 20000, 0, PaymentMethod.COD, "Alice", "0988888888", "Hanoi", null);
        order.setStatus(OrderStatus.PENDING);

        when(orderDAO.findByOrderCodeAndStoreId("ORD-20261004-0001", storeId)).thenReturn(Optional.of(order));
        when(orderItemDAO.findByOrderId("ord-1")).thenReturn(List.of());

        // 1. PENDING -> CONFIRMED
        OrderResponse confirmed = orderService.updateStoreOrderStatus("ORD-20261004-0001", storeId, OrderStatus.CONFIRMED, "Accepted by shop", "seller-user-1");
        assertEquals(OrderStatus.CONFIRMED, confirmed.status());
        verify(orderDAO).updateStatus("ord-1", OrderStatus.CONFIRMED);

        // 2. CONFIRMED -> SHIPPING
        OrderResponse shipping = orderService.updateStoreOrderStatus("ORD-20261004-0001", storeId, OrderStatus.SHIPPING, "Dispatched via GHTK - Tracking: GHTK-001", "seller-user-1");
        assertEquals(OrderStatus.SHIPPING, shipping.status());
        verify(orderDAO).updateStatus("ord-1", OrderStatus.SHIPPING);
    }
}
