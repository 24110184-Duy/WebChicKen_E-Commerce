package com.example.webchicken.modules.order.dao;

import com.example.webchicken.common.enums.OrderStatus;
import com.example.webchicken.common.enums.PaymentStatus;
import com.example.webchicken.infrastructure.persistence.BaseDAO;
import com.example.webchicken.modules.order.model.entity.OrderEntity;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.TypedQuery;

import java.util.List;
import java.util.Optional;

/**
 * Data Access Object cho bảng orders.
 */
public class OrderDAO extends BaseDAO {

    public OrderDAO(EntityManagerFactory emf) {
        super(emf);
    }

    public void save(OrderEntity order) {
        executeInTransaction(em -> {
            OrderEntity existing = em.find(OrderEntity.class, order.getId());
            if (existing == null) {
                em.persist(order);
            } else {
                em.merge(order);
            }
        });
    }

    public Optional<OrderEntity> findById(String id) {
        if (id == null || id.isBlank()) return Optional.empty();
        return executeQuery(em -> Optional.ofNullable(em.find(OrderEntity.class, id)));
    }

    public Optional<OrderEntity> findByOrderCode(String orderCode) {
        if (orderCode == null || orderCode.isBlank()) return Optional.empty();
        return executeQuery(em -> {
            List<OrderEntity> list = em.createQuery(
                    "SELECT o FROM OrderEntity o WHERE o.orderCode = :orderCode", OrderEntity.class)
                    .setParameter("orderCode", orderCode.trim())
                    .setMaxResults(1)
                    .getResultList();
            return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
        });
    }

    public List<OrderEntity> findByCustomerId(String customerId, OrderStatus status, int offset, int limit) {
        return executeQuery(em -> {
            String jpql = "SELECT o FROM OrderEntity o WHERE o.customerId = :customerId ";
            if (status != null) {
                jpql += "AND o.status = :status ";
            }
            jpql += "ORDER BY o.orderDate DESC";

            TypedQuery<OrderEntity> query = em.createQuery(jpql, OrderEntity.class)
                    .setParameter("customerId", customerId);
            if (status != null) {
                query.setParameter("status", status);
            }
            query.setFirstResult(Math.max(0, offset));
            query.setMaxResults(Math.min(100, Math.max(1, limit)));
            return query.getResultList();
        });
    }

    public long countByCustomerId(String customerId, OrderStatus status) {
        return executeQuery(em -> {
            String jpql = "SELECT COUNT(o) FROM OrderEntity o WHERE o.customerId = :customerId ";
            if (status != null) {
                jpql += "AND o.status = :status";
            }
            TypedQuery<Long> query = em.createQuery(jpql, Long.class)
                    .setParameter("customerId", customerId);
            if (status != null) {
                query.setParameter("status", status);
            }
            return query.getSingleResult();
        });
    }

    public void updateStatus(String orderId, OrderStatus status) {
        executeInTransaction(em -> {
            em.createQuery("UPDATE OrderEntity o SET o.status = :status WHERE o.id = :id")
                    .setParameter("status", status)
                    .setParameter("id", orderId)
                    .executeUpdate();
        });
    }

    public void updatePaymentStatus(String orderId, PaymentStatus paymentStatus) {
        executeInTransaction(em -> {
            em.createQuery("UPDATE OrderEntity o SET o.paymentStatus = :paymentStatus WHERE o.id = :id")
                    .setParameter("paymentStatus", paymentStatus)
                    .setParameter("id", orderId)
                    .executeUpdate();
        });
    }

    public List<OrderEntity> findByStoreId(String storeId, OrderStatus status, int offset, int limit) {
        return executeQuery(em -> {
            String jpql = "SELECT o FROM OrderEntity o WHERE o.storeId = :storeId ";
            if (status != null) {
                jpql += "AND o.status = :status ";
            }
            jpql += "ORDER BY o.orderDate DESC";

            TypedQuery<OrderEntity> query = em.createQuery(jpql, OrderEntity.class)
                    .setParameter("storeId", storeId);
            if (status != null) {
                query.setParameter("status", status);
            }
            query.setFirstResult(Math.max(0, offset));
            query.setMaxResults(Math.min(100, Math.max(1, limit)));
            return query.getResultList();
        });
    }

    public long countByStoreId(String storeId, OrderStatus status) {
        return executeQuery(em -> {
            String jpql = "SELECT COUNT(o) FROM OrderEntity o WHERE o.storeId = :storeId ";
            if (status != null) {
                jpql += "AND o.status = :status";
            }
            TypedQuery<Long> query = em.createQuery(jpql, Long.class)
                    .setParameter("storeId", storeId);
            if (status != null) {
                query.setParameter("status", status);
            }
            return query.getSingleResult();
        });
    }

    public Optional<OrderEntity> findByOrderCodeAndStoreId(String orderCode, String storeId) {
        if (orderCode == null || orderCode.isBlank() || storeId == null || storeId.isBlank()) return Optional.empty();
        return executeQuery(em -> {
            List<OrderEntity> list = em.createQuery(
                    "SELECT o FROM OrderEntity o WHERE o.orderCode = :orderCode AND o.storeId = :storeId", OrderEntity.class)
                    .setParameter("orderCode", orderCode.trim())
                    .setParameter("storeId", storeId.trim())
                    .setMaxResults(1)
                    .getResultList();
            return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
        });
    }

    /**
     * Tra cứu danh sách đơn hàng theo trạng thái (phục vụ Background Workers như ShippingSimulationJob).
     */
    public List<OrderEntity> findByStatus(OrderStatus status, int limit) {
        if (status == null) return List.of();
        return executeQuery(em -> {
            String jpql = "SELECT o FROM OrderEntity o WHERE o.status = :status ORDER BY o.orderDate ASC";
            TypedQuery<OrderEntity> query = em.createQuery(jpql, OrderEntity.class)
                    .setParameter("status", status);
            query.setMaxResults(Math.min(100, Math.max(1, limit)));
            return query.getResultList();
        });
    }
}

