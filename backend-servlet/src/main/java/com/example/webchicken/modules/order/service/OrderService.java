package com.example.webchicken.modules.order.service;

import com.example.webchicken.common.enums.OrderStatus;
import com.example.webchicken.modules.order.model.dto.request.CheckoutRequest;
import com.example.webchicken.modules.order.model.dto.response.CheckoutResponse;
import com.example.webchicken.modules.order.model.dto.response.OrderResponse;

import java.util.List;

/**
 * Service quản lý đặt hàng, tra cứu đơn hàng và hủy đơn hàng (TASK-44, TASK-45, TASK-46, TASK-49).
 */
public interface OrderService {

    /**
     * Thuật toán Multi-shop checkout partition kết hợp Atomic Checkout Transaction.
     */
    CheckoutResponse checkout(String customerId, CheckoutRequest request);

    /**
     * Danh sách đơn hàng của người mua (phân trang + lọc status).
     */
    List<OrderResponse> getOrders(String customerId, OrderStatus status, int page, int size);

    long countOrders(String customerId, OrderStatus status);

    /**
     * Chi tiết đơn hàng theo order_code.
     */
    OrderResponse getOrderByCode(String orderCode, String customerId);

    /**
     * Hủy đơn hàng an toàn, nhả tồn kho đã giữ (TASK-49).
     */
    OrderResponse cancelOrder(String orderCode, String customerId, String reason);
}
