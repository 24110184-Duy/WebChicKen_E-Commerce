package com.example.webchicken.modules.catalog.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import com.example.webchicken.modules.catalog.model.entity.CategoryEntity;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.TypedQuery;
import java.util.List;
import java.util.Optional;

/**
 * Data Access Object cho bảng {@code categories}.
 */
public class CategoryDAO extends BaseDAO {

    public CategoryDAO(EntityManagerFactory emf) {
        super(emf);
    }

    public List<CategoryEntity> findAll() {
        return executeQuery(em -> {
            TypedQuery<CategoryEntity> q = em.createQuery(
                    "SELECT c FROM CategoryEntity c ORDER BY c.name ASC",
                    CategoryEntity.class);
            return q.getResultList();
        });
    }

    public Optional<CategoryEntity> findById(String id) {
        return executeQuery(em -> Optional.ofNullable(em.find(CategoryEntity.class, id)));
    }

    public Optional<CategoryEntity> findByName(String name) {
        return executeQuery(em -> {
            TypedQuery<CategoryEntity> q = em.createQuery(
                    "SELECT c FROM CategoryEntity c WHERE LOWER(c.name) = LOWER(:name)",
                    CategoryEntity.class);
            q.setParameter("name", name.trim());
            q.setMaxResults(1);
            return q.getResultList().stream().findFirst();
        });
    }

    public boolean existsById(String id) {
        return executeQuery(em -> {
            TypedQuery<Long> q = em.createQuery(
                    "SELECT COUNT(c) FROM CategoryEntity c WHERE c.id = :id", Long.class);
            q.setParameter("id", id);
            return q.getSingleResult() > 0;
        });
    }

    public void save(CategoryEntity category) {
        executeInTransaction(em -> em.persist(category));
    }

    public CategoryEntity update(CategoryEntity category) {
        return executeInTransactionReturning(em -> em.merge(category));
    }

    public void deleteById(String id) {
        executeInTransaction(em -> {
            CategoryEntity ref = em.find(CategoryEntity.class, id);
            if (ref != null) {
                em.remove(ref);
            }
        });
    }
}
