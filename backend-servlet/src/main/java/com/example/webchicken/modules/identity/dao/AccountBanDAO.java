package com.example.webchicken.modules.identity.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import com.example.webchicken.modules.identity.model.entity.AccountBanEntity;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.TypedQuery;
import java.util.List;
import java.util.Optional;

/** Data Access Object cho bảng {@code account_bans}. */
public class AccountBanDAO extends BaseDAO {

    public AccountBanDAO(EntityManagerFactory emf) {
        super(emf);
    }

    /** Lấy tất cả lệnh ban của một user (lịch sử cấm). */
    public List<AccountBanEntity> findByUserId(String userId) {
        return executeQuery(em -> {
            TypedQuery<AccountBanEntity> q = em.createQuery(
                    "SELECT b FROM AccountBanEntity b WHERE b.userId = :uid ORDER BY b.bannedAt DESC",
                    AccountBanEntity.class);
            q.setParameter("uid", userId);
            return q.getResultList();
        });
    }

    /** Lấy lệnh ban đang có hiệu lực gần nhất của một user. */
    public Optional<AccountBanEntity> findActiveBanByUserId(String userId) {
        return executeQuery(em -> {
            TypedQuery<AccountBanEntity> q = em.createQuery(
                    "SELECT b FROM AccountBanEntity b WHERE b.userId = :uid AND b.unbannedAt IS NULL ORDER BY b.bannedAt DESC",
                    AccountBanEntity.class);
            q.setParameter("uid", userId);
            q.setMaxResults(1);
            return q.getResultList().stream().findFirst();
        });
    }

    /** Lưu lệnh ban mới. */
    public void save(AccountBanEntity ban) {
        executeInTransaction(em -> em.persist(ban));
    }

    /** Cập nhật thông tin lệnh ban (ví dụ khi mở khóa unban). */
    public AccountBanEntity update(AccountBanEntity ban) {
        return executeInTransactionReturning(em -> em.merge(ban));
    }
}
