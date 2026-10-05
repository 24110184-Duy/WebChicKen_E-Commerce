package com.example.webchicken.modules.order.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import com.example.webchicken.modules.order.model.entity.OrderStatusHistoryEntity;
import jakarta.persistence.EntityManagerFactory;

import java.util.List;

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
}
