package com.example.webchicken.modules.identity.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import com.example.webchicken.modules.identity.model.entity.AddressEntity;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.TypedQuery;
import java.util.List;
import java.util.Optional;

/** Data Access Object cho bảng {@code addresses}. */
public class AddressDAO extends BaseDAO {

    public AddressDAO(EntityManagerFactory emf) {
        super(emf);
    }

    /** Lấy tất cả địa chỉ của một user. */
    public List<AddressEntity> findByUserId(String userId) {
        return executeQuery(em -> {
            TypedQuery<AddressEntity> q = em.createQuery(
                    "SELECT a FROM AddressEntity a WHERE a.userId = :uid ORDER BY a.isDefault DESC",
                    AddressEntity.class);
            q.setParameter("uid", userId);
            return q.getResultList();
        });
    }

    /** Lấy địa chỉ mặc định của user. */
    public Optional<AddressEntity> findDefaultByUserId(String userId) {
        return executeQuery(em -> {
            TypedQuery<AddressEntity> q = em.createQuery(
                    "SELECT a FROM AddressEntity a WHERE a.userId = :uid AND a.isDefault = true",
                    AddressEntity.class);
            q.setParameter("uid", userId);
            q.setMaxResults(1);
            return q.getResultList().stream().findFirst();
        });
    }

    /** Lưu địa chỉ mới. */
    public void save(AddressEntity address) {
        executeInTransaction(em -> em.persist(address));
    }

    /** Cập nhật địa chỉ. */
    public AddressEntity update(AddressEntity address) {
        return executeInTransactionReturning(em -> em.merge(address));
    }

    /** Xóa địa chỉ theo ID. */
    public void deleteById(String addressId) {
        executeInTransaction(em -> {
            AddressEntity ref = em.find(AddressEntity.class, addressId);
            if (ref != null) em.remove(ref);
        });
    }
}
