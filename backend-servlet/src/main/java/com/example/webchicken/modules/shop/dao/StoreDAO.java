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
        ensureDefaultStoreExists();
    }

    private void ensureDefaultStoreExists() {
        try {
            executeInTransaction(em -> {
                Number count = (Number) em.createNativeQuery(
                        "SELECT COUNT(*) FROM stores WHERE id = 's0000000-0000-0000-0000-000000000001'")
                        .getSingleResult();
                if (count.longValue() == 0) {
                    List<?> sellerIds = em.createNativeQuery("SELECT id FROM sellers LIMIT 1").getResultList();
                    String sellerId;
                    if (!sellerIds.isEmpty()) {
                        sellerId = sellerIds.get(0).toString().trim();
                    } else {
                        List<?> userIds = em.createNativeQuery("SELECT id FROM users LIMIT 1").getResultList();
                        if (!userIds.isEmpty()) {
                            sellerId = userIds.get(0).toString().trim();
                            em.createNativeQuery("INSERT INTO sellers (id, approved_at) VALUES ('" + sellerId + "', CURRENT_TIMESTAMP) ON CONFLICT (id) DO NOTHING").executeUpdate();
                        } else {
                            sellerId = null;
                        }
                    }

                    if (sellerId != null) {
                        em.createNativeQuery("INSERT INTO stores (id, store_name, store_type, seller_id, created_at) " +
                                "VALUES ('s0000000-0000-0000-0000-000000000001', 'TechZone Official Store', 'MALL', '" + sellerId + "', CURRENT_TIMESTAMP) " +
                                "ON CONFLICT (id) DO NOTHING").executeUpdate();
                    }
                }
            });
        } catch (Exception ignored) {}
    }

    public boolean existsById(String id) {
        if (id == null || id.isBlank()) return false;
        return executeQuery(em -> {
            TypedQuery<Long> q = em.createQuery(
                    "SELECT COUNT(s) FROM StoreEntity s WHERE s.id = :id", Long.class);
            q.setParameter("id", id);
            return q.getSingleResult() > 0;
        });
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
