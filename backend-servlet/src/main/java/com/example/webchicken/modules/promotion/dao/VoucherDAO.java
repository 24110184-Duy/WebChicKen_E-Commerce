package com.example.webchicken.modules.promotion.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import com.example.webchicken.modules.promotion.model.entity.VoucherEntity;
import jakarta.persistence.EntityManagerFactory;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public class VoucherDAO extends BaseDAO {

    public VoucherDAO(EntityManagerFactory emf) {
        super(emf);
    }

    public Optional<VoucherEntity> findByCode(String code) {
        if (code == null || code.isBlank()) return Optional.empty();
        return executeQuery(em -> {
            List<VoucherEntity> list = em.createQuery(
                    "SELECT v FROM VoucherEntity v WHERE UPPER(v.code) = UPPER(:code)", VoucherEntity.class)
                    .setParameter("code", code.trim())
                    .setMaxResults(1)
                    .getResultList();
            return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
        });
    }

    public Optional<VoucherEntity> findById(String id) {
        if (id == null || id.isBlank()) return Optional.empty();
        return executeQuery(em -> Optional.ofNullable(em.find(VoucherEntity.class, id)));
    }

    public List<VoucherEntity> findActiveVouchers(String storeId) {
        LocalDateTime now = LocalDateTime.now();
        return executeQuery(em -> {
            if (storeId != null && !storeId.isBlank()) {
                return em.createQuery(
                        "SELECT v FROM VoucherEntity v WHERE v.isActive = true " +
                        "AND v.startDate <= :now AND v.endDate >= :now " +
                        "AND (v.storeId IS NULL OR v.storeId = :storeId) " +
                        "AND v.usedCount < v.usageLimit ORDER BY v.endDate ASC", VoucherEntity.class)
                        .setParameter("now", now)
                        .setParameter("storeId", storeId)
                        .getResultList();
            } else {
                return em.createQuery(
                        "SELECT v FROM VoucherEntity v WHERE v.isActive = true " +
                        "AND v.startDate <= :now AND v.endDate >= :now " +
                        "AND v.usedCount < v.usageLimit ORDER BY v.endDate ASC", VoucherEntity.class)
                        .setParameter("now", now)
                        .getResultList();
            }
        });
    }

    public void incrementUsedCount(String voucherId) {
        executeInTransaction(em -> {
            em.createQuery("UPDATE VoucherEntity v SET v.usedCount = v.usedCount + 1 WHERE v.id = :id")
                    .setParameter("id", voucherId)
                    .executeUpdate();
        });
    }

    public void save(VoucherEntity voucher) {
        executeInTransaction(em -> {
            VoucherEntity existing = em.find(VoucherEntity.class, voucher.getId());
            if (existing == null) {
                em.persist(voucher);
            } else {
                em.merge(voucher);
            }
        });
    }
}
