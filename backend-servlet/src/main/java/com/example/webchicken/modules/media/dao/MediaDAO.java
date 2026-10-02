package com.example.webchicken.modules.media.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import com.example.webchicken.modules.media.model.entity.MediaAssetEntity;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.TypedQuery;
import java.util.List;
import java.util.Optional;

/**
 * Data Access Object cho bảng {@code media_assets}.
 */
public class MediaDAO extends BaseDAO {

    public MediaDAO(EntityManagerFactory emf) {
        super(emf);
    }

    public void save(MediaAssetEntity entity) {
        executeInTransaction(em -> em.persist(entity));
    }

    public Optional<MediaAssetEntity> findById(String id) {
        return executeQuery(em -> Optional.ofNullable(em.find(MediaAssetEntity.class, id)));
    }

    public List<MediaAssetEntity> findByUserId(String userId) {
        return executeQuery(em -> {
            TypedQuery<MediaAssetEntity> q = em.createQuery(
                    "SELECT m FROM MediaAssetEntity m WHERE m.userId = :userId ORDER BY m.createdAt DESC",
                    MediaAssetEntity.class);
            q.setParameter("userId", userId);
            return q.getResultList();
        });
    }
}
