package com.example.webchicken.modules.catalog.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import com.example.webchicken.modules.catalog.model.entity.ProductImageEntity;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.TypedQuery;
import java.util.List;

/**
 * Data Access Object cho bảng {@code product_images}.
 */
public class ProductImageDAO extends BaseDAO {

    public ProductImageDAO(EntityManagerFactory emf) {
        super(emf);
    }

    public List<ProductImageEntity> findByProductId(String productId) {
        return executeQuery(em -> {
            TypedQuery<ProductImageEntity> q = em.createQuery(
                    "SELECT img FROM ProductImageEntity img WHERE img.productId = :pid",
                    ProductImageEntity.class);
            q.setParameter("pid", productId);
            return q.getResultList();
        });
    }

    public void save(ProductImageEntity image) {
        executeInTransaction(em -> em.persist(image));
    }

    public void deleteByProductId(String productId) {
        executeInTransaction(em -> {
            em.createQuery("DELETE FROM ProductImageEntity img WHERE img.productId = :pid")
              .setParameter("pid", productId)
              .executeUpdate();
        });
    }
}
