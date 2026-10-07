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

    /**
     * Tìm danh sách các voucher vẫn đang active nhưng đã hết hạn hoặc hết lượt sử dụng (TASK-70).
     */
    public List<VoucherEntity> findExpiredActiveVouchers(LocalDateTime now, boolean includeUsageLimit, int limit) {
        return executeQuery(em -> {
            String jpql = "SELECT v FROM VoucherEntity v WHERE v.isActive = true AND (v.endDate < :now" +
                    (includeUsageLimit ? " OR v.usedCount >= v.usageLimit" : "") + ") ORDER BY v.endDate ASC";
            return em.createQuery(jpql, VoucherEntity.class)
                    .setParameter("now", now)
                    .setMaxResults(Math.max(1, limit))
                    .getResultList();
        });
    }

    /**
     * Vô hiệu hóa một voucher theo ID (TASK-70).
     */
    public void deactivateVoucher(String voucherId) {
        executeInTransaction(em -> {
            em.createQuery("UPDATE VoucherEntity v SET v.isActive = false WHERE v.id = :id")
                    .setParameter("id", voucherId)
                    .executeUpdate();
        });
    }

    /**
     * Thực hiện vô hiệu hóa hàng loạt các voucher đã hết hạn hoặc hết lượt (TASK-70).
     * @return Số lượng voucher đã được cập nhật trạng thái sang inactive.
     */
    public int deactivateExpiredVouchers(LocalDateTime now, boolean includeUsageLimit) {
        return executeInTransactionReturning(em -> {
            String jpql = "UPDATE VoucherEntity v SET v.isActive = false WHERE v.isActive = true AND (v.endDate < :now" +
                    (includeUsageLimit ? " OR v.usedCount >= v.usageLimit" : "") + ")";
            return em.createQuery(jpql)
                    .setParameter("now", now)
                    .executeUpdate();
        });
    }

    /**
     * Lấy toàn bộ danh sách voucher có phân trang (dùng cho Backoffice Admin).
     */
    public List<VoucherEntity> findAll(int page, int size) {
        int safePage = Math.max(1, page);
        int safeSize = Math.min(100, Math.max(1, size));
        return executeQuery(em -> em.createQuery("SELECT v FROM VoucherEntity v ORDER BY v.startDate DESC", VoucherEntity.class)
                .setFirstResult((safePage - 1) * safeSize)
                .setMaxResults(safeSize)
                .getResultList());
    }

    /**
     * Đếm tổng số voucher trên hệ thống.
     */
    public long countAll() {
        return executeQuery(em -> em.createQuery("SELECT COUNT(v) FROM VoucherEntity v", Long.class)
                .getSingleResult());
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
