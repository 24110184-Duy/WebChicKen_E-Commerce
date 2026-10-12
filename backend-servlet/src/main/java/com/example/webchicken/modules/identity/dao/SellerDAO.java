package com.example.webchicken.modules.identity.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import com.example.webchicken.modules.identity.model.entity.SellerEntity;
import jakarta.persistence.EntityManagerFactory;
import java.util.Optional;

/** Data Access Object cho bảng {@code sellers}. */
public class SellerDAO extends BaseDAO {

    public SellerDAO(EntityManagerFactory emf) {
        super(emf);
    }

    /** Tìm seller theo ID (cũng là user_id). */
    public Optional<SellerEntity> findById(String sellerId) {
        if (sellerId == null || sellerId.isBlank()) return Optional.empty();
        return executeQuery(em -> {
            try {
                SellerEntity seller = em.find(SellerEntity.class, sellerId);
                if (seller != null) return Optional.of(seller);
            } catch (Exception ignored) {}
            try {
                Number count = (Number) em.createNativeQuery(
                        "SELECT COUNT(*) FROM sellers WHERE id = ?")
                        .setParameter(1, sellerId)
                        .getSingleResult();
                if (count != null && count.longValue() > 0) {
                    SellerEntity fallback = new SellerEntity();
                    fallback.setUserId(sellerId);
                    return Optional.of(fallback);
                }
            } catch (Exception ignored) {}
            return Optional.empty();
        });
    }

    /** Lưu seller mới. Nếu bản ghi trong users đã tồn tại, chèn an toàn vào bảng sellers */
    public void save(SellerEntity seller) {
        if (seller == null || seller.getUserId() == null || seller.getUserId().isBlank()) {
            return;
        }
        executeInTransaction(em -> {
            Number count = (Number) em.createNativeQuery(
                    "SELECT COUNT(*) FROM sellers WHERE id = ?")
                    .setParameter(1, seller.getUserId())
                    .getSingleResult();
            if (count.longValue() == 0) {
                em.createNativeQuery(
                        "INSERT INTO sellers (id, tax_code, approved_at) VALUES (?, ?, ?)")
                        .setParameter(1, seller.getUserId())
                        .setParameter(2, seller.getTaxCode())
                        .setParameter(3, seller.getApprovedAt() != null ? seller.getApprovedAt() : java.time.LocalDateTime.now())
                        .executeUpdate();
            }
        });
    }

    /** Cập nhật seller. */
    public SellerEntity update(SellerEntity seller) {
        return executeInTransactionReturning(em -> em.merge(seller));
    }
}
