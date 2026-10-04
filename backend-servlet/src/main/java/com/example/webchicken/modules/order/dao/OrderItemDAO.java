package com.example.webchicken.modules.order.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import com.example.webchicken.modules.order.model.entity.OrderItemEntity;
import jakarta.persistence.EntityManagerFactory;

import java.util.List;

public class OrderItemDAO extends BaseDAO {

    public OrderItemDAO(EntityManagerFactory emf) {
        super(emf);
    }

    public void save(OrderItemEntity item) {
        executeInTransaction(em -> {
            OrderItemEntity existing = em.find(OrderItemEntity.class, item.getId());
            if (existing == null) {
                em.persist(item);
            } else {
                em.merge(item);
            }
        });
    }

    public List<OrderItemEntity> findByOrderId(String orderId) {
        return executeQuery(em -> em.createQuery(
                "SELECT i FROM OrderItemEntity i WHERE i.orderId = :orderId", OrderItemEntity.class)
                .setParameter("orderId", orderId)
                .getResultList());
    }
}
