package com.example.webchicken.modules.shop.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import com.example.webchicken.modules.shop.model.entity.FeedbackEntity;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.TypedQuery;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Data Access Object cho bảng feedback_to_admins (TASK-69).
 * Quản lý các phiếu phản hồi, khiếu nại và thắc mắc từ Người bán gửi lên Ban Quản Trị.
 */
public class FeedbackDAO extends BaseDAO {

    public FeedbackDAO(EntityManagerFactory emf) {
        super(emf);
    }

    public void save(FeedbackEntity entity) {
        executeInTransaction(em -> {
            FeedbackEntity existing = em.find(FeedbackEntity.class, entity.getId());
            if (existing == null) {
                em.persist(entity);
            } else {
                em.merge(entity);
            }
        });
    }

    public void update(FeedbackEntity entity) {
        executeInTransaction(em -> em.merge(entity));
    }

    public Optional<FeedbackEntity> findById(String id) {
        if (id == null || id.isBlank()) return Optional.empty();
        return executeQuery(em -> Optional.ofNullable(em.find(FeedbackEntity.class, id.trim())));
    }

    public List<FeedbackEntity> findByUserId(String userId, int page, int size) {
        if (userId == null || userId.isBlank()) return List.of();
        int safePage = Math.max(1, page);
        int safeSize = Math.min(100, Math.max(1, size));
        int offset = (safePage - 1) * safeSize;

        return executeQuery(em -> em.createQuery(
                "SELECT f FROM FeedbackEntity f WHERE f.userId = :userId ORDER BY f.createdAt DESC",
                FeedbackEntity.class)
                .setParameter("userId", userId.trim())
                .setFirstResult(offset)
                .setMaxResults(safeSize)
                .getResultList());
    }

    public long countByUserId(String userId) {
        if (userId == null || userId.isBlank()) return 0;
        return executeQuery(em -> em.createQuery(
                "SELECT COUNT(f) FROM FeedbackEntity f WHERE f.userId = :userId", Long.class)
                .setParameter("userId", userId.trim())
                .getSingleResult());
    }

    public List<FeedbackEntity> findAll(int page, int size, String status, String type, String search) {
        int safePage = Math.max(1, page);
        int safeSize = Math.min(100, Math.max(1, size));
        int offset = (safePage - 1) * safeSize;

        return executeQuery(em -> {
            StringBuilder jpql = new StringBuilder("SELECT f FROM FeedbackEntity f WHERE 1=1 ");
            Map<String, Object> params = new HashMap<>();

            if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
                jpql.append("AND f.status = :status ");
                params.put("status", status.trim().toUpperCase());
            }

            if (type != null && !type.isBlank() && !"ALL".equalsIgnoreCase(type)) {
                jpql.append("AND f.type = :type ");
                params.put("type", type.trim().toUpperCase());
            }

            if (search != null && !search.isBlank()) {
                jpql.append("AND (LOWER(f.subject) LIKE :search OR LOWER(f.content) LIKE :search) ");
                params.put("search", "%" + search.trim().toLowerCase() + "%");
            }

            jpql.append("ORDER BY f.createdAt DESC");

            TypedQuery<FeedbackEntity> query = em.createQuery(jpql.toString(), FeedbackEntity.class);
            params.forEach(query::setParameter);

            query.setFirstResult(offset);
            query.setMaxResults(safeSize);
            return query.getResultList();
        });
    }

    public long countAll(String status, String type, String search) {
        return executeQuery(em -> {
            StringBuilder jpql = new StringBuilder("SELECT COUNT(f) FROM FeedbackEntity f WHERE 1=1 ");
            Map<String, Object> params = new HashMap<>();

            if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
                jpql.append("AND f.status = :status ");
                params.put("status", status.trim().toUpperCase());
            }

            if (type != null && !type.isBlank() && !"ALL".equalsIgnoreCase(type)) {
                jpql.append("AND f.type = :type ");
                params.put("type", type.trim().toUpperCase());
            }

            if (search != null && !search.isBlank()) {
                jpql.append("AND (LOWER(f.subject) LIKE :search OR LOWER(f.content) LIKE :search) ");
                params.put("search", "%" + search.trim().toLowerCase() + "%");
            }

            TypedQuery<Long> query = em.createQuery(jpql.toString(), Long.class);
            params.forEach(query::setParameter);
            return query.getSingleResult();
        });
    }
}
