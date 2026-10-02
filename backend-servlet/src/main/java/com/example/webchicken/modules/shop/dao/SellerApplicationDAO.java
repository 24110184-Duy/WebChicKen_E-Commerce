package com.example.webchicken.modules.shop.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import com.example.webchicken.modules.shop.model.entity.SellerApplicationEntity;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.TypedQuery;
import java.util.List;
import java.util.Optional;

/**
 * Data Access Object cho bảng {@code seller_applications}.
 */
public class SellerApplicationDAO extends BaseDAO {

    public SellerApplicationDAO(EntityManagerFactory emf) {
        super(emf);
    }

    public void save(SellerApplicationEntity entity) {
        executeInTransaction(em -> em.persist(entity));
    }

    public SellerApplicationEntity update(SellerApplicationEntity entity) {
        return executeInTransactionReturning(em -> em.merge(entity));
    }

    public Optional<SellerApplicationEntity> findById(String id) {
        return executeQuery(em -> Optional.ofNullable(em.find(SellerApplicationEntity.class, id)));
    }

    public Optional<SellerApplicationEntity> findPendingByUserId(String userId) {
        return executeQuery(em -> {
            TypedQuery<SellerApplicationEntity> q = em.createQuery(
                    "SELECT a FROM SellerApplicationEntity a WHERE a.userId = :userId AND a.status = 'PENDING'",
                    SellerApplicationEntity.class);
            q.setParameter("userId", userId);
            q.setMaxResults(1);
            return q.getResultList().stream().findFirst();
        });
    }

    public Optional<SellerApplicationEntity> findLatestByUserId(String userId) {
        return executeQuery(em -> {
            TypedQuery<SellerApplicationEntity> q = em.createQuery(
                    "SELECT a FROM SellerApplicationEntity a WHERE a.userId = :userId ORDER BY a.submittedAt DESC",
                    SellerApplicationEntity.class);
            q.setParameter("userId", userId);
            q.setMaxResults(1);
            return q.getResultList().stream().findFirst();
        });
    }

    public List<SellerApplicationEntity> findAll(int page, int size, String status) {
        return executeQuery(em -> {
            StringBuilder jpql = new StringBuilder("SELECT a FROM SellerApplicationEntity a");
            if (status != null && !status.isBlank()) {
                jpql.append(" WHERE a.status = :status");
            }
            jpql.append(" ORDER BY a.submittedAt DESC");

            TypedQuery<SellerApplicationEntity> q = em.createQuery(jpql.toString(), SellerApplicationEntity.class);
            if (status != null && !status.isBlank()) {
                q.setParameter("status", status.trim().toUpperCase());
            }
            q.setFirstResult(Math.max(0, (page - 1) * size));
            q.setMaxResults(Math.min(100, Math.max(1, size)));
            return q.getResultList();
        });
    }
}
