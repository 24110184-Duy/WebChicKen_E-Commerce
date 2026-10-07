package com.example.webchicken.modules.order.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import com.example.webchicken.modules.order.model.entity.OrderStatusHistoryEntity;
import jakarta.persistence.EntityManagerFactory;

import com.example.webchicken.common.enums.OrderStatus;
import java.util.List;
import java.util.Optional;

/**
 * Data Access Object for order_status_histories table (TASK-54).
 */
public class OrderStatusHistoryDAO extends BaseDAO {

    public OrderStatusHistoryDAO(EntityManagerFactory emf) {
        super(emf);
    }

    public void save(OrderStatusHistoryEntity history) {
        executeInTransaction(em -> {
            OrderStatusHistoryEntity existing = em.find(OrderStatusHistoryEntity.class, history.getId());
            if (existing == null) {
                em.persist(history);
            } else {
                em.merge(history);
            }
        });
    }

    public List<OrderStatusHistoryEntity> findByOrderId(String orderId) {
        return executeQuery(em -> em.createQuery(
                "SELECT h FROM OrderStatusHistoryEntity h WHERE h.orderId = :orderId ORDER BY h.createdAt ASC",
                OrderStatusHistoryEntity.class)
                .setParameter("orderId", orderId)
                .getResultList());
    }

    /**
     * Tìm bản ghi lịch sử trạng thái mới nhất của đơn hàng ứng với trạng thái mục tiêu (toStatus).
     */
    public Optional<OrderStatusHistoryEntity> findLatestHistoryByOrderIdAndToStatus(String orderId, OrderStatus toStatus) {
        if (orderId == null || orderId.isBlank() || toStatus == null) return Optional.empty();
        return executeQuery(em -> {
            List<OrderStatusHistoryEntity> list = em.createQuery(
                    "SELECT h FROM OrderStatusHistoryEntity h WHERE h.orderId = :orderId AND h.toStatus = :toStatus ORDER BY h.createdAt DESC",
                    OrderStatusHistoryEntity.class)
                    .setParameter("orderId", orderId)
                    .setParameter("toStatus", toStatus)
                    .setMaxResults(1)
                    .getResultList();
            return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
        });
    }
}
