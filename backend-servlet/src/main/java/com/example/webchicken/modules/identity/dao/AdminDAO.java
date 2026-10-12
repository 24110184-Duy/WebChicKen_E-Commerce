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
        if (adminId == null || adminId.isBlank()) return Optional.empty();
        return executeQuery(em -> {
            try {
                AdminEntity admin = em.find(AdminEntity.class, adminId);
                if (admin != null) return Optional.of(admin);
            } catch (Exception ignored) {}
            try {
                java.util.List<?> rows = em.createNativeQuery(
                        "SELECT id, role FROM admins WHERE id = ?")
                        .setParameter(1, adminId)
                        .getResultList();
                if (!rows.isEmpty()) {
                    AdminEntity fallback = new AdminEntity();
                    fallback.setUserId(adminId);
                    Object row = rows.get(0);
                    if (row instanceof Object[] arr && arr.length > 1 && arr[1] != null) {
                        try {
                            fallback.setRole(com.example.webchicken.common.enums.AdminRole.valueOf(arr[1].toString().trim()));
                        } catch (Exception ignored) {}
                    }
                    return Optional.of(fallback);
                }
            } catch (Exception ignored) {}
            return Optional.empty();
        });
    }

    /** Lưu admin mới. */
    public void save(AdminEntity admin) {
        executeInTransaction(em -> em.persist(admin));
    }

    /** Cập nhật admin. */
    public AdminEntity update(AdminEntity admin) {
        return executeInTransactionReturning(em -> em.merge(admin));
    }
}
