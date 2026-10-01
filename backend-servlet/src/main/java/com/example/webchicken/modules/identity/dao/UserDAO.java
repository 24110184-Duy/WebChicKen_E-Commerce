package com.example.webchicken.modules.identity.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import com.example.webchicken.modules.identity.model.entity.UserEntity;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.TypedQuery;
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
}
