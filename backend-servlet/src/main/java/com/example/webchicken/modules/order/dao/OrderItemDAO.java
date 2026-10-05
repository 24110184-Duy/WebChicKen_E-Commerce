package com.example.webchicken.modules.order.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import com.example.webchicken.modules.order.model.entity.OrderItemEntity;
import jakarta.persistence.EntityManagerFactory;

import java.util.List;
import java.util.Optional;

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

    public Optional<OrderItemEntity> findById(String id) {
        if (id == null || id.isBlank()) return Optional.empty();
        return executeQuery(em -> Optional.ofNullable(em.find(OrderItemEntity.class, id)));
    }

    public List<OrderItemEntity> findByOrderId(String orderId) {
        return executeQuery(em -> em.createQuery(
                "SELECT i FROM OrderItemEntity i WHERE i.orderId = :orderId", OrderItemEntity.class)
                .setParameter("orderId", orderId)
                .getResultList());
    }
}
