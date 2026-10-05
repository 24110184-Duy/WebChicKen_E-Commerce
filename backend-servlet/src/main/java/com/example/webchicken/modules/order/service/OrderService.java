package com.example.webchicken.modules.order.service;

import com.example.webchicken.common.enums.OrderStatus;
import com.example.webchicken.modules.order.model.dto.request.CheckoutRequest;
import com.example.webchicken.modules.order.model.dto.response.CheckoutResponse;
import com.example.webchicken.modules.order.model.dto.response.OrderResponse;
import com.example.webchicken.modules.order.model.dto.response.OrderStatusHistoryResponse;
import com.example.webchicken.modules.order.model.enums.OrderActorType;

import java.util.List;

/**
 * Service quản lý đặt hàng, tra cứu đơn hàng và hủy đơn hàng (TASK-44, TASK-45, TASK-46, TASK-49, TASK-54).
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
     * Hủy đơn hàng an toàn qua State Machine (TASK-49, TASK-54).
     */
    OrderResponse cancelOrder(String orderCode, String customerId, String reason);

    /**
     * Chuyển đổi trạng thái đơn hàng thông qua OrderStateMachine (TASK-54).
     */
    OrderResponse updateOrderStatus(String orderCode, OrderStatus targetStatus, OrderActorType actorType, String actorId, String reason);

    /**
     * Lấy lịch sử hành trình trạng thái của đơn hàng (Audit Timeline) (TASK-54).
     */
    List<OrderStatusHistoryResponse> getOrderStatusHistory(String orderCode, String customerId);

    /**
     * Danh sách đơn hàng theo gian hàng của Seller (phân trang + lọc status) (TASK-59).
     */
    List<OrderResponse> getStoreOrders(String storeId, OrderStatus status, int page, int size);

    /**
     * Tổng số đơn hàng theo gian hàng của Seller (TASK-59).
     */
    long countStoreOrders(String storeId, OrderStatus status);

    /**
     * Chi tiết đơn hàng thuộc gian hàng của Seller kèm kiểm tra quyền sở hữu IDOR (TASK-59).
     */
    OrderResponse getStoreOrderByCode(String orderCode, String storeId);

    /**
     * Seller chuyển trạng thái đơn hàng (Xác nhận, Đóng gói giao vận, Hoàn tất, Hủy) (TASK-59).
     */
    OrderResponse updateStoreOrderStatus(String orderCode, String storeId, OrderStatus targetStatus, String reason, String actorId);

    /**
     * Lấy dữ liệu thống kê tổng hợp hiệu suất bán hàng & doanh thu cho Seller Dashboard (TASK-60).
     */
    com.example.webchicken.modules.order.model.dto.response.SellerDashboardStatsResponse getStoreDashboardStats(String storeId, String period);
}

