package com.example.webchicken.modules.order.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import com.example.webchicken.modules.order.model.entity.OrderEntity;
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

    public java.util.Map<String, Integer> getSoldCounts(List<String> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            return java.util.Collections.emptyMap();
        }
        return executeQuery(em -> {
            List<Object[]> rows = em.createQuery(
                    "SELECT i.productId, SUM(i.quantity) FROM OrderItemEntity i, OrderEntity o " +
                    "WHERE i.orderId = o.id " +
                    "  AND o.status NOT IN (com.example.webchicken.common.enums.OrderStatus.CANCELLED, com.example.webchicken.common.enums.OrderStatus.RETURNED) " +
                    "  AND (o.paymentStatus = com.example.webchicken.common.enums.PaymentStatus.PAID " +
                    "       OR (o.paymentMethod = com.example.webchicken.modules.order.model.enums.PaymentMethod.COD AND o.status IN (com.example.webchicken.common.enums.OrderStatus.CONFIRMED, com.example.webchicken.common.enums.OrderStatus.SHIPPING, com.example.webchicken.common.enums.OrderStatus.DELIVERED))) " +
                    "  AND i.productId IN :productIds " +
                    "GROUP BY i.productId",
                    Object[].class)
                    .setParameter("productIds", productIds)
                    .getResultList();

            java.util.Map<String, Integer> map = new java.util.HashMap<>();
            for (Object[] row : rows) {
                String pid = (String) row[0];
                Number sumQty = (Number) row[1];
                map.put(pid, sumQty != null ? sumQty.intValue() : 0);
            }
            return map;
        });
    }
}
