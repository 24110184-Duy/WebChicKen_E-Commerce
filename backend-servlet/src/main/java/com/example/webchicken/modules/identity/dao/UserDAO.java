package com.example.webchicken.modules.identity.dao;

import com.example.webchicken.common.enums.UserStatus;
import com.example.webchicken.infrastructure.persistence.BaseDAO;
import com.example.webchicken.modules.identity.model.entity.AdminEntity;
import com.example.webchicken.modules.identity.model.entity.CustomerEntity;
import com.example.webchicken.modules.identity.model.entity.SellerEntity;
import com.example.webchicken.modules.identity.model.entity.UserEntity;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.TypedQuery;
import java.util.List;
import java.util.Optional;

/**
 * Data Access Object cho bảng {@code users}.
 * Dùng JPA/Hibernate — EntityManager để truy vấn và quản lý entity.
 */
public class UserDAO extends BaseDAO {

    public UserDAO(EntityManagerFactory emf) {
        super(emf);
    }

    /** Tìm user theo ID. */
    public Optional<UserEntity> findById(String userId) {
        return executeQuery(em -> {
            UserEntity entity = em.find(UserEntity.class, userId);
            return Optional.ofNullable(entity);
        });
    }

    /** Tìm user theo email (dùng JPQL). */
    public Optional<UserEntity> findByEmail(String email) {
        return executeQuery(em -> {
            TypedQuery<UserEntity> q = em.createQuery(
                    "SELECT u FROM UserEntity u WHERE u.email = :email", UserEntity.class);
            q.setParameter("email", email);
            q.setMaxResults(1);
            return q.getResultList().stream().findFirst();
        });
    }

    /** Kiểm tra email đã tồn tại. */
    public boolean existsByEmail(String email) {
        return executeQuery(em -> {
            TypedQuery<Long> q = em.createQuery(
                    "SELECT COUNT(u) FROM UserEntity u WHERE u.email = :email", Long.class);
            q.setParameter("email", email);
            return q.getSingleResult() > 0;
        });
    }

    /** Lưu user mới vào DB. */
    public void save(UserEntity user) {
        executeInTransaction(em -> em.persist(user));
    }

    /** Cập nhật user đã có. */
    public UserEntity update(UserEntity user) {
        return executeInTransactionReturning(em -> em.merge(user));
    }

    /**
     * Truy vấn danh sách người dùng với phân trang và bộ lọc tìm kiếm.
     */
    public List<UserEntity> findAll(int page, int size, String search, String status, String role) {
        int safePage = Math.max(1, page);
        int safeSize = Math.min(100, Math.max(1, size));

        return executeQuery(em -> {
            StringBuilder jpql = new StringBuilder("SELECT u FROM UserEntity u WHERE 1=1");

            UserStatus userStatus = parseStatus(status);
            if (userStatus != null) {
                jpql.append(" AND u.status = :status");
            }

            boolean hasSearch = (search != null && !search.trim().isBlank());
            if (hasSearch) {
                jpql.append(" AND (LOWER(u.email) LIKE :search OR LOWER(u.fullName) LIKE :search OR u.phone LIKE :searchPhone)");
            }

            appendRoleFilter(jpql, role);

            jpql.append(" ORDER BY u.createdAt DESC");

            TypedQuery<UserEntity> query = em.createQuery(jpql.toString(), UserEntity.class);

            if (userStatus != null) {
                query.setParameter("status", userStatus);
            }
            if (hasSearch) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                query.setParameter("search", pattern);
                query.setParameter("searchPhone", "%" + search.trim() + "%");
            }

            query.setFirstResult((safePage - 1) * safeSize);
            query.setMaxResults(safeSize);

            return query.getResultList();
        });
    }

    /**
     * Đếm tổng số lượng người dùng thỏa mãn bộ lọc.
     */
    public long countAll(String search, String status, String role) {
        return executeQuery(em -> {
            StringBuilder jpql = new StringBuilder("SELECT COUNT(u) FROM UserEntity u WHERE 1=1");

            UserStatus userStatus = parseStatus(status);
            if (userStatus != null) {
                jpql.append(" AND u.status = :status");
            }

            boolean hasSearch = (search != null && !search.trim().isBlank());
            if (hasSearch) {
                jpql.append(" AND (LOWER(u.email) LIKE :search OR LOWER(u.fullName) LIKE :search OR u.phone LIKE :searchPhone)");
            }

            appendRoleFilter(jpql, role);

            TypedQuery<Long> query = em.createQuery(jpql.toString(), Long.class);

            if (userStatus != null) {
                query.setParameter("status", userStatus);
            }
            if (hasSearch) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                query.setParameter("search", pattern);
                query.setParameter("searchPhone", "%" + search.trim() + "%");
            }

            return query.getSingleResult();
        });
    }

    private UserStatus parseStatus(String status) {
        if (status == null || status.trim().isBlank() || "ALL".equalsIgnoreCase(status.trim())) {
            return null;
        }
        try {
            return UserStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private void appendRoleFilter(StringBuilder jpql, String role) {
        if (role == null || role.trim().isBlank() || "ALL".equalsIgnoreCase(role.trim())) {
            return;
        }
        String normalized = role.trim().toUpperCase();
        if ("CUSTOMER".equals(normalized)) {
            jpql.append(" AND TYPE(u) = CustomerEntity");
        } else if ("SELLER".equals(normalized)) {
            jpql.append(" AND TYPE(u) = SellerEntity");
        } else if ("ADMIN".equals(normalized) || "SUPER_ADMIN".equals(normalized) || "MODERATOR".equals(normalized)) {
            jpql.append(" AND TYPE(u) = AdminEntity");
        }
    }
}
