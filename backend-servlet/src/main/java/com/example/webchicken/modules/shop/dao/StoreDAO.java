package com.example.webchicken.modules.shop.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import com.example.webchicken.modules.shop.model.entity.StoreEntity;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.TypedQuery;
import java.util.List;
import java.util.Optional;

/**
 * Data Access Object cho bảng {@code stores}.
 */
public class StoreDAO extends BaseDAO {

    public StoreDAO(EntityManagerFactory emf) {
        super(emf);
    }

    public void save(StoreEntity store) {
        executeInTransaction(em -> em.persist(store));
    }

    public StoreEntity update(StoreEntity store) {
        return executeInTransactionReturning(em -> em.merge(store));
    }

    public Optional<StoreEntity> findById(String storeId) {
        return executeQuery(em -> Optional.ofNullable(em.find(StoreEntity.class, storeId)));
    }

    public Optional<StoreEntity> findBySellerId(String sellerId) {
        return executeQuery(em -> {
            TypedQuery<StoreEntity> q = em.createQuery(
                    "SELECT s FROM StoreEntity s WHERE s.sellerId = :sellerId",
                    StoreEntity.class);
            q.setParameter("sellerId", sellerId);
            q.setMaxResults(1);
            return q.getResultList().stream().findFirst();
        });
    }

    public List<StoreEntity> findAll(int page, int size) {
        return executeQuery(em -> {
            TypedQuery<StoreEntity> q = em.createQuery(
                    "SELECT s FROM StoreEntity s ORDER BY s.createdAt DESC",
                    StoreEntity.class);
            q.setFirstResult(Math.max(0, (page - 1) * size));
            q.setMaxResults(Math.min(100, Math.max(1, size)));
            return q.getResultList();
        });
    }
}
