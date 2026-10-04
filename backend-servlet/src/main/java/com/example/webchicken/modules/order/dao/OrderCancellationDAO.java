package com.example.webchicken.modules.order.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import com.example.webchicken.modules.order.model.entity.OrderCancellationEntity;
import jakarta.persistence.EntityManagerFactory;

import java.util.List;
import java.util.Optional;

/**
 * Data Access Object cho bảng order_cancellations (TASK-49).
 */
public class OrderCancellationDAO extends BaseDAO {

    public OrderCancellationDAO(EntityManagerFactory emf) {
        super(emf);
    }

    public void save(OrderCancellationEntity cancellation) {
        executeInTransaction(em -> {
            OrderCancellationEntity existing = em.find(OrderCancellationEntity.class, cancellation.getId());
            if (existing == null) {
                em.persist(cancellation);
            } else {
                em.merge(cancellation);
            }
        });
    }

    public Optional<OrderCancellationEntity> findByOrderId(String orderId) {
        return executeQuery(em -> {
            List<OrderCancellationEntity> list = em.createQuery(
                    "SELECT c FROM OrderCancellationEntity c WHERE c.orderId = :orderId ORDER BY c.cancelAt DESC",
                    OrderCancellationEntity.class)
                    .setParameter("orderId", orderId)
                    .setMaxResults(1)
                    .getResultList();
            return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
        });
    }
}
