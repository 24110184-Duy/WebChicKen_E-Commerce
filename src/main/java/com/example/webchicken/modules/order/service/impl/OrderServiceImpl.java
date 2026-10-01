package com.example.webchicken.modules.order.service.impl;

import com.example.webchicken.modules.order.dao.OrderCancellationDAO;
import com.example.webchicken.modules.order.dao.OrderDAO;
import com.example.webchicken.modules.order.dao.OrderItemDAO;
import com.example.webchicken.modules.order.service.OrderService;
import java.util.Objects;

public class OrderServiceImpl implements OrderService {

    private final OrderDAO orderDAO;
    private final OrderItemDAO orderItemDAO;
    private final OrderCancellationDAO orderCancellationDAO;

    public OrderServiceImpl(OrderDAO orderDAO, OrderItemDAO orderItemDAO, OrderCancellationDAO orderCancellationDAO) {
        this.orderDAO = Objects.requireNonNull(orderDAO, "orderDAO must not be null");
        this.orderItemDAO = Objects.requireNonNull(orderItemDAO, "orderItemDAO must not be null");
        this.orderCancellationDAO = Objects.requireNonNull(orderCancellationDAO, "orderCancellationDAO must not be null");
    }

    // TODO: implement methods
}
