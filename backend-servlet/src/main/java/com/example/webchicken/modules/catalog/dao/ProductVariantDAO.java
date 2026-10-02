package com.example.webchicken.modules.catalog.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import com.example.webchicken.modules.catalog.model.entity.ProductVariantEntity;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.TypedQuery;
import java.util.List;
import java.util.Optional;

/**
 * Data Access Object cho bảng {@code product_variants}.
 */
public class ProductVariantDAO extends BaseDAO {

    public ProductVariantDAO(EntityManagerFactory emf) {
        super(emf);
    }

    public List<ProductVariantEntity> findByProductId(String productId) {
        return executeQuery(em -> {
            TypedQuery<ProductVariantEntity> q = em.createQuery(
                    "SELECT v FROM ProductVariantEntity v WHERE v.productId = :pid",
                    ProductVariantEntity.class);
            q.setParameter("pid", productId);
            return q.getResultList();
        });
    }

    public Optional<ProductVariantEntity> findById(String id) {
        return executeQuery(em -> Optional.ofNullable(em.find(ProductVariantEntity.class, id)));
    }

    public void save(ProductVariantEntity variant) {
        executeInTransaction(em -> em.persist(variant));
    }

    public ProductVariantEntity update(ProductVariantEntity variant) {
        return executeInTransactionReturning(em -> em.merge(variant));
    }

    public void deleteByProductId(String productId) {
        executeInTransaction(em -> {
            em.createQuery("DELETE FROM ProductVariantEntity v WHERE v.productId = :pid")
              .setParameter("pid", productId)
              .executeUpdate();
        });
    }

    public void deleteById(String id) {
        executeInTransaction(em -> {
            ProductVariantEntity ref = em.find(ProductVariantEntity.class, id);
            if (ref != null) em.remove(ref);
        });
    }
}
