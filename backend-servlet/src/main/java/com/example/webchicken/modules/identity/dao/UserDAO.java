package com.example.webchicken.modules.identity.dao;

import com.example.webchicken.common.enums.UserStatus;
import com.example.webchicken.infrastructure.persistence.BaseDAO;
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
        if (email == null || email.isBlank()) return Optional.empty();
        return executeQuery(em -> {
            TypedQuery<UserEntity> q = em.createQuery(
                    "SELECT u FROM UserEntity u WHERE LOWER(u.email) = :email", UserEntity.class);
            q.setParameter("email", email.trim().toLowerCase());
            q.setMaxResults(1);
            return q.getResultList().stream().findFirst();
        });
    }

    /** Kiểm tra email đã tồn tại. */
    public boolean existsByEmail(String email) {
        if (email == null || email.isBlank()) return false;
        return executeQuery(em -> {
            TypedQuery<Long> q = em.createQuery(
                    "SELECT COUNT(u) FROM UserEntity u WHERE LOWER(u.email) = :email", Long.class);
            q.setParameter("email", email.trim().toLowerCase());
            return q.getSingleResult() > 0;
        });
    }

    /** Tìm user theo username. */
    public Optional<UserEntity> findByUsername(String username) {
        if (username == null || username.isBlank()) return Optional.empty();
        return executeQuery(em -> {
            TypedQuery<UserEntity> q = em.createQuery(
                    "SELECT u FROM UserEntity u WHERE LOWER(u.username) = :username", UserEntity.class);
            q.setParameter("username", username.trim().toLowerCase());
            q.setMaxResults(1);
            return q.getResultList().stream().findFirst();
        });
    }

    /** Kiểm tra username đã tồn tại. */
    public boolean existsByUsername(String username) {
        if (username == null || username.isBlank()) return false;
        return executeQuery(em -> {
            TypedQuery<Long> q = em.createQuery(
                    "SELECT COUNT(u) FROM UserEntity u WHERE LOWER(u.username) = :username", Long.class);
            q.setParameter("username", username.trim().toLowerCase());
            return q.getSingleResult() > 0;
        });
    }

    /** Tìm user theo phone. */
    public Optional<UserEntity> findByPhone(String phone) {
        if (phone == null || phone.isBlank()) return Optional.empty();
        return executeQuery(em -> {
            TypedQuery<UserEntity> q = em.createQuery(
                    "SELECT u FROM UserEntity u WHERE u.phone = :phone", UserEntity.class);
            q.setParameter("phone", phone.trim());
            q.setMaxResults(1);
            return q.getResultList().stream().findFirst();
        });
    }

    /** Kiểm tra phone đã tồn tại. */
    public boolean existsByPhone(String phone) {
        if (phone == null || phone.isBlank()) return false;
        String raw = phone.trim();
        String norm = com.example.webchicken.common.validation.VietnamesePhoneValidator.normalize(raw);
        return executeQuery(em -> {
            TypedQuery<Long> q = em.createQuery(
                    "SELECT COUNT(u) FROM UserEntity u WHERE u.phone = :phone OR u.phone = :normPhone", Long.class);
            q.setParameter("phone", raw);
            q.setParameter("normPhone", norm != null ? norm : raw);
            return q.getSingleResult() > 0;
        });
    }

    /**
     * Tìm user theo 1 trong 3 thông tin định danh: Username, Email hoặc Phone.
     */
    public Optional<UserEntity> findByIdentifier(String identifier) {
        if (identifier == null || identifier.isBlank()) return Optional.empty();
        String trimmed = identifier.trim();
        String lower = trimmed.toLowerCase();
        String normPhone = com.example.webchicken.common.validation.VietnamesePhoneValidator.normalize(trimmed);

        return executeQuery(em -> {
            TypedQuery<UserEntity> q = em.createQuery(
                    "SELECT u FROM UserEntity u WHERE LOWER(u.email) = :lower OR LOWER(u.username) = :lower OR u.phone = :raw OR u.phone = :normPhone",
                    UserEntity.class);
            q.setParameter("lower", lower);
            q.setParameter("raw", trimmed);
            q.setParameter("normPhone", normPhone != null ? normPhone : trimmed);
            q.setMaxResults(1);
            return q.getResultList().stream().findFirst();
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
                jpql.append(" AND (LOWER(u.email) LIKE :search OR LOWER(u.username) LIKE :search OR LOWER(u.fullName) LIKE :search OR u.phone LIKE :searchPhone)");
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
                jpql.append(" AND (LOWER(u.email) LIKE :search OR LOWER(u.username) LIKE :search OR LOWER(u.fullName) LIKE :search OR u.phone LIKE :searchPhone)");
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
