package com.example.webchicken.modules.identity.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import com.example.webchicken.modules.identity.model.entity.UserSocialAccountEntity;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.TypedQuery;
import java.util.List;
import java.util.Optional;

/**
 * Data Access Object cho bảng {@code user_social_accounts}.
 * Kế thừa {@link BaseDAO}.
 */
public class UserSocialAccountDAO extends BaseDAO {

    public UserSocialAccountDAO(EntityManagerFactory emf) {
        super(emf);
    }

    /**
     * Tìm liên kết mạng xã hội theo nhà cung cấp (provider: GOOGLE, FACEBOOK) và user id phía provider.
     */
    public Optional<UserSocialAccountEntity> findByProviderAndProviderUserId(String provider, String providerUserId) {
        if (provider == null || providerUserId == null) return Optional.empty();
        return executeQuery(em -> {
            TypedQuery<UserSocialAccountEntity> query = em.createQuery(
                    "SELECT a FROM UserSocialAccountEntity a WHERE UPPER(a.provider) = :provider AND a.providerUserId = :providerUserId",
                    UserSocialAccountEntity.class
            );
            query.setParameter("provider", provider.trim().toUpperCase());
            query.setParameter("providerUserId", providerUserId.trim());
            query.setMaxResults(1);
            return query.getResultList().stream().findFirst();
        });
    }

    /**
     * Lấy danh sách các tài khoản mạng xã hội đã liên kết của một người dùng nội bộ.
     */
    public List<UserSocialAccountEntity> findByUserId(String userId) {
        return executeQuery(em -> {
            TypedQuery<UserSocialAccountEntity> query = em.createQuery(
                    "SELECT a FROM UserSocialAccountEntity a WHERE a.userId = :userId ORDER BY a.createdAt ASC",
                    UserSocialAccountEntity.class
            );
            query.setParameter("userId", userId);
            return query.getResultList();
        });
    }

    /**
     * Lưu mới liên kết tài khoản mạng xã hội.
     */
    public void save(UserSocialAccountEntity account) {
        executeInTransaction(em -> em.persist(account));
    }

    /**
     * Cập nhật thông tin liên kết mạng xã hội.
     */
    public UserSocialAccountEntity update(UserSocialAccountEntity account) {
        return executeInTransactionReturning(em -> em.merge(account));
    }

    /**
     * Xóa liên kết tài khoản mạng xã hội.
     */
    public void delete(UserSocialAccountEntity account) {
        executeInTransaction(em -> {
            UserSocialAccountEntity managed = em.contains(account) ? account : em.merge(account);
            em.remove(managed);
        });
    }
}
