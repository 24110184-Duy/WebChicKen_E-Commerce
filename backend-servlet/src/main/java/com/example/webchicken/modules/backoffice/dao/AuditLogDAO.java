package com.example.webchicken.modules.backoffice.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import com.example.webchicken.modules.backoffice.model.entity.AuditLogEntity;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.TypedQuery;

import java.util.List;
import java.util.Optional;

/**
 * Data Access Object cho bảng {@code audit_logs}.
 * Ghi nhận và truy vấn nhật ký kiểm toán bất biến các thao tác nhạy cảm (TASK-67).
 */
public class AuditLogDAO extends BaseDAO {

    public AuditLogDAO(EntityManagerFactory emf) {
        super(emf);
    }

    /** Lưu bản ghi nhật ký kiểm toán mới. */
    public void save(AuditLogEntity log) {
        executeInTransaction(em -> em.persist(log));
    }

    /** Tìm nhật ký kiểm toán theo ID. */
    public Optional<AuditLogEntity> findById(String id) {
        return executeQuery(em -> Optional.ofNullable(em.find(AuditLogEntity.class, id)));
    }

    /** Truy vấn danh sách nhật ký kiểm toán có phân trang và bộ lọc. */
    public List<AuditLogEntity> findAll(int page, int size, String adminId, String action, String targetType, String search) {
        int safePage = Math.max(1, page);
        int safeSize = Math.min(100, Math.max(1, size));

        return executeQuery(em -> {
            StringBuilder jpql = new StringBuilder("SELECT a FROM AuditLogEntity a WHERE 1=1");

            boolean hasAdmin = adminId != null && !adminId.trim().isBlank();
            if (hasAdmin) jpql.append(" AND a.adminId = :adminId");

            boolean hasAction = action != null && !action.trim().isBlank() && !"ALL".equalsIgnoreCase(action.trim());
            if (hasAction) jpql.append(" AND a.action = :action");

            boolean hasTargetType = targetType != null && !targetType.trim().isBlank() && !"ALL".equalsIgnoreCase(targetType.trim());
            if (hasTargetType) jpql.append(" AND a.targetType = :targetType");

            boolean hasSearch = search != null && !search.trim().isBlank();
            if (hasSearch) {
                jpql.append(" AND (LOWER(a.detail) LIKE :search OR LOWER(a.action) LIKE :search OR a.targetId LIKE :search)");
            }

            jpql.append(" ORDER BY a.createdAt DESC");

            TypedQuery<AuditLogEntity> query = em.createQuery(jpql.toString(), AuditLogEntity.class);

            if (hasAdmin) query.setParameter("adminId", adminId.trim());
            if (hasAction) query.setParameter("action", action.trim().toUpperCase());
            if (hasTargetType) query.setParameter("targetType", targetType.trim().toUpperCase());
            if (hasSearch) {
                query.setParameter("search", "%" + search.trim().toLowerCase() + "%");
            }

            query.setFirstResult((safePage - 1) * safeSize);
            query.setMaxResults(safeSize);

            return query.getResultList();
        });
    }

    /** Đếm tổng số bản ghi nhật ký kiểm toán thỏa mãn bộ lọc. */
    public long countAll(String adminId, String action, String targetType, String search) {
        return executeQuery(em -> {
            StringBuilder jpql = new StringBuilder("SELECT COUNT(a) FROM AuditLogEntity a WHERE 1=1");

            boolean hasAdmin = adminId != null && !adminId.trim().isBlank();
            if (hasAdmin) jpql.append(" AND a.adminId = :adminId");

            boolean hasAction = action != null && !action.trim().isBlank() && !"ALL".equalsIgnoreCase(action.trim());
            if (hasAction) jpql.append(" AND a.action = :action");

            boolean hasTargetType = targetType != null && !targetType.trim().isBlank() && !"ALL".equalsIgnoreCase(targetType.trim());
            if (hasTargetType) jpql.append(" AND a.targetType = :targetType");

            boolean hasSearch = search != null && !search.trim().isBlank();
            if (hasSearch) {
                jpql.append(" AND (LOWER(a.detail) LIKE :search OR LOWER(a.action) LIKE :search OR a.targetId LIKE :search)");
            }

            TypedQuery<Long> query = em.createQuery(jpql.toString(), Long.class);

            if (hasAdmin) query.setParameter("adminId", adminId.trim());
            if (hasAction) query.setParameter("action", action.trim().toUpperCase());
            if (hasTargetType) query.setParameter("targetType", targetType.trim().toUpperCase());
            if (hasSearch) {
                query.setParameter("search", "%" + search.trim().toLowerCase() + "%");
            }

            return query.getSingleResult();
        });
    }
}
