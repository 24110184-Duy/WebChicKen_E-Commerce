package com.example.webchicken.modules.identity.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import com.example.webchicken.modules.identity.model.entity.SellerEntity;
import jakarta.persistence.EntityManagerFactory;
import java.util.Optional;

/** Data Access Object cho bảng {@code sellers}. */
public class SellerDAO extends BaseDAO {

    public SellerDAO(EntityManagerFactory emf) {
        super(emf);
    }

    /** Tìm seller theo ID (cũng là user_id). */
    public Optional<SellerEntity> findById(String sellerId) {
        return executeQuery(em -> Optional.ofNullable(em.find(SellerEntity.class, sellerId)));
    }

    /** Lưu seller mới. */
    public void save(SellerEntity seller) {
        executeInTransaction(em -> em.persist(seller));
    }

    /** Cập nhật seller. */
    public SellerEntity update(SellerEntity seller) {
        return executeInTransaction(em -> em.merge(seller));
    }
}
