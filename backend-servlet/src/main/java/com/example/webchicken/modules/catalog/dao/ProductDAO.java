package com.example.webchicken.modules.catalog.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import com.example.webchicken.modules.catalog.model.dto.request.ProductFilterCriteria;
import com.example.webchicken.modules.catalog.model.entity.ProductEntity;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.TypedQuery;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Data Access Object cho bảng {@code products}.
 * Hỗ trợ tìm kiếm, lọc đa tiêu chí và phân trang (PERF-01, SEC-01).
 */
public class ProductDAO extends BaseDAO {

    public ProductDAO(EntityManagerFactory emf) {
        super(emf);
    }

    public Optional<ProductEntity> findById(String id) {
        return executeQuery(em -> Optional.ofNullable(em.find(ProductEntity.class, id)));
    }

    public boolean existsById(String id) {
        return executeQuery(em -> {
            TypedQuery<Long> q = em.createQuery(
                    "SELECT COUNT(p) FROM ProductEntity p WHERE p.id = :id", Long.class);
            q.setParameter("id", id);
            return q.getSingleResult() > 0;
        });
    }

    public List<ProductEntity> findWithFilters(ProductFilterCriteria filter) {
        return executeQuery(em -> {
            StringBuilder jpql = new StringBuilder("SELECT p FROM ProductEntity p WHERE 1=1");
            Map<String, Object> params = new HashMap<>();

            buildFilterConditions(filter, jpql, params);

            // Sorting
            if ("newest".equalsIgnoreCase(filter.sort())) {
                jpql.append(" ORDER BY p.createdAt DESC");
            } else {
                jpql.append(" ORDER BY p.createdAt DESC");
            }

            TypedQuery<ProductEntity> q = em.createQuery(jpql.toString(), ProductEntity.class);
            params.forEach(q::setParameter);

            q.setFirstResult(filter.offset());
            q.setMaxResults(filter.size());

            return q.getResultList();
        });
    }

    public long countWithFilters(ProductFilterCriteria filter) {
        return executeQuery(em -> {
            StringBuilder jpql = new StringBuilder("SELECT COUNT(p) FROM ProductEntity p WHERE 1=1");
            Map<String, Object> params = new HashMap<>();

            buildFilterConditions(filter, jpql, params);

            TypedQuery<Long> q = em.createQuery(jpql.toString(), Long.class);
            params.forEach(q::setParameter);

            return q.getSingleResult();
        });
    }

    private void buildFilterConditions(ProductFilterCriteria filter, StringBuilder jpql, Map<String, Object> params) {
        if (filter.query() != null && !filter.query().isEmpty()) {
            jpql.append(" AND (LOWER(p.name) LIKE :q OR LOWER(p.description) LIKE :q)");
            params.put("q", "%" + filter.query().toLowerCase() + "%");
        }
        if (filter.categoryId() != null && !filter.categoryId().isEmpty()) {
            jpql.append(" AND p.categoryId = :cid");
            params.put("cid", filter.categoryId());
        }
        if (filter.storeId() != null && !filter.storeId().isEmpty()) {
            jpql.append(" AND p.storeId = :sid");
            params.put("sid", filter.storeId());
        }
        if (filter.status() != null) {
            jpql.append(" AND p.status = :status");
            params.put("status", filter.status());
        }
    }

    public void save(ProductEntity product) {
        executeInTransaction(em -> em.persist(product));
    }

    public ProductEntity update(ProductEntity product) {
        return executeInTransactionReturning(em -> em.merge(product));
    }

    public void deleteById(String id) {
        executeInTransaction(em -> {
            ProductEntity ref = em.find(ProductEntity.class, id);
            if (ref != null) em.remove(ref);
        });
    }
}
