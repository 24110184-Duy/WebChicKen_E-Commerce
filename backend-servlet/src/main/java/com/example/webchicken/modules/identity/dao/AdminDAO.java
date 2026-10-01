package com.example.webchicken.modules.identity.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import com.example.webchicken.modules.identity.model.entity.AdminEntity;
import jakarta.persistence.EntityManagerFactory;
import java.util.Optional;

/** Data Access Object cho bảng {@code admins}. */
public class AdminDAO extends BaseDAO {

    public AdminDAO(EntityManagerFactory emf) {
        super(emf);
    }

    /** Tìm admin theo ID (cũng là user_id). */
    public Optional<AdminEntity> findById(String adminId) {
        return executeQuery(em -> Optional.ofNullable(em.find(AdminEntity.class, adminId)));
    }

    /** Lưu admin mới. */
    public void save(AdminEntity admin) {
        executeInTransaction(em -> em.persist(admin));
    }

    /** Cập nhật admin. */
    public AdminEntity update(AdminEntity admin) {
        return executeInTransaction(em -> em.merge(admin));
    }
}
