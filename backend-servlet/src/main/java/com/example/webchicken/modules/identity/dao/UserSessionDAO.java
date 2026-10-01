package com.example.webchicken.modules.identity.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import com.example.webchicken.modules.identity.model.entity.UserSessionEntity;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.TypedQuery;
import java.util.Optional;

/**
 * Data Access Object cho bảng {@code user_sessions}.
 * Lưu refresh token trong CSDL (không phải HttpSession — README 2.1 #7).
 */
public class UserSessionDAO extends BaseDAO {

    public UserSessionDAO(EntityManagerFactory emf) {
        super(emf);
    }

    /** Tìm session đang active theo cookie content (refresh token hash). */
    public Optional<UserSessionEntity> findActiveByCookieContent(String cookieContent) {
        return executeQuery(em -> {
            TypedQuery<UserSessionEntity> q = em.createQuery(
                    "SELECT s FROM UserSessionEntity s WHERE s.cookieContent = :cc AND s.isActive = true",
                    UserSessionEntity.class);
            q.setParameter("cc", cookieContent);
            q.setMaxResults(1);
            return q.getResultList().stream().findFirst();
        });
    }

    /** Lưu session mới. */
    public void save(UserSessionEntity session) {
        executeInTransaction(em -> em.persist(session));
    }

    /** Vô hiệu hoá tất cả session của một user (logout all devices). */
    public int deactivateAllByUserId(String userId) {
        return executeInTransactionReturning(em -> em
                .createQuery("UPDATE UserSessionEntity s SET s.isActive = false WHERE s.userId = :uid")
                .setParameter("uid", userId)
                .executeUpdate());
    }

    /** Vô hiệu hoá một session cụ thể. */
    public void deactivate(UserSessionEntity session) {
        executeInTransaction(em -> {
            UserSessionEntity managed = em.merge(session);
            managed.setActive(false);
        });
    }
}
