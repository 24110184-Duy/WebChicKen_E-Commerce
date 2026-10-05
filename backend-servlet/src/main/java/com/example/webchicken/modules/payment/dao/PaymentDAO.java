package com.example.webchicken.modules.payment.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import com.example.webchicken.modules.payment.model.entity.PaymentEntity;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.NoResultException;

import java.util.Optional;

/**
 * Data Access Object cho bảng payments (TASK-50).
 */
public class PaymentDAO extends BaseDAO {

    public PaymentDAO(EntityManagerFactory emf) {
        super(emf);
    }

    public void save(PaymentEntity payment) {
        executeInTransaction(em -> em.persist(payment));
    }

    public void update(PaymentEntity payment) {
        executeInTransaction(em -> em.merge(payment));
    }

    public Optional<PaymentEntity> findById(String id) {
        return executeQuery(em -> Optional.ofNullable(em.find(PaymentEntity.class, id)));
    }

    public Optional<PaymentEntity> findByOrderId(String orderId) {
        return executeQuery(em -> {
            try {
                PaymentEntity payment = em.createQuery(
                        "SELECT p FROM PaymentEntity p WHERE p.orderId = :orderId ORDER BY p.paidAt DESC",
                        PaymentEntity.class)
                        .setParameter("orderId", orderId)
                        .setMaxResults(1)
                        .getSingleResult();
                return Optional.of(payment);
            } catch (NoResultException e) {
                return Optional.empty();
            }
        });
    }
}
