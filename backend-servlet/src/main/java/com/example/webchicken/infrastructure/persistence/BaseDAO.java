package com.example.webchicken.infrastructure.persistence;

import com.example.webchicken.common.exception.DataAccessException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.EntityTransaction;
import java.util.Objects;
import java.util.function.Consumer;
import java.util.function.Function;

/**
 * Lớp cơ sở cho toàn bộ DAO trong hệ thống — JPA/Hibernate (RESOURCE_LOCAL).
 * <p>
 * Mọi DAO kế thừa lớp này và nhận {@link EntityManagerFactory} qua constructor.
 * Không dùng JDBC/DataSource trực tiếp; mọi truy cập DB đi qua EntityManager.
 * </p>
 */
public abstract class BaseDAO {

    protected final EntityManagerFactory emf;

    protected BaseDAO(EntityManagerFactory emf) {
        this.emf = Objects.requireNonNull(emf, "EntityManagerFactory must not be null");
    }

    public EntityManagerFactory getEntityManagerFactory() {
        return emf;
    }

    // ── EntityManager helpers ──────────────────────────────────────────────────

    /** Tạo EntityManager mới. Caller chịu trách nhiệm đóng (dùng qua executeQuery/executeInTransaction). */
    protected EntityManager em() {
        return emf.createEntityManager();
    }

    // ── Read (no transaction needed for JPA reads) ─────────────────────────────

    /**
     * Thực thi một tác vụ đọc có trả về kết quả.
     * EntityManager được đóng tự động sau khi xong.
     */
    protected <R> R executeQuery(Function<EntityManager, R> action) {
        EntityManager em = em();
        try {
            return action.apply(em);
        } catch (Exception e) {
            throw translateException("executeQuery", e);
        } finally {
            closeQuietly(em);
        }
    }

    // ── Write (requires transaction) ───────────────────────────────────────────

    /**
     * Thực thi một tác vụ ghi (INSERT/UPDATE/DELETE) với giao dịch tự động.
     * Tự động rollback nếu có lỗi.
     */
    protected void executeInTransaction(Consumer<EntityManager> action) {
        EntityManager em = em();
        EntityTransaction tx = em.getTransaction();
        try {
            tx.begin();
            action.accept(em);
            tx.commit();
        } catch (Exception e) {
            if (tx.isActive()) tx.rollback();
            throw translateException("executeInTransaction", e);
        } finally {
            closeQuietly(em);
        }
    }

    /**
     * Thực thi một tác vụ ghi có trả về kết quả, với giao dịch tự động.
     */
    protected <R> R executeInTransactionReturning(Function<EntityManager, R> action) {
        EntityManager em = em();
        EntityTransaction tx = em.getTransaction();
        try {
            tx.begin();
            R result = action.apply(em);
            tx.commit();
            return result;
        } catch (Exception e) {
            if (tx.isActive()) tx.rollback();
            throw translateException("executeInTransactionReturning", e);
        } finally {
            closeQuietly(em);
        }
    }

    // ── Exception translation ──────────────────────────────────────────────────

    /** Bọc mọi ngoại lệ CSDL thành {@link DataAccessException} (EXC-01). */
    protected DataAccessException translateException(String operation, Exception e) {
        return new DataAccessException(
                "Lỗi thao tác CSDL [" + operation + "]: " + e.getMessage(), e);
    }

    // ── Internal ───────────────────────────────────────────────────────────────

    private void closeQuietly(EntityManager em) {
        if (em != null && em.isOpen()) {
            try { em.close(); } catch (Exception ignored) { }
        }
    }
}
