package com.example.webchicken.infrastructure.persistence;

import com.example.webchicken.common.exception.DataAccessException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.EntityTransaction;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Objects;
import java.util.function.Consumer;
import java.util.function.Function;

/**
 * Lớp cơ sở cho toàn bộ các lớp DAO trong hệ thống.
 * Hỗ trợ cả JPA / Hibernate (EntityManagerFactory) và JDBC thuần (DataSource).
 * Cung cấp quản lý EntityManager, giao dịch RESOURCE_LOCAL, và chuẩn hóa lỗi sang DataAccessException.
 */
public abstract class BaseDAO {

    protected final EntityManagerFactory entityManagerFactory;
    protected final DataSource dataSource;

    protected BaseDAO(EntityManagerFactory entityManagerFactory) {
        this.entityManagerFactory = Objects.requireNonNull(entityManagerFactory, "entityManagerFactory must not be null");
        this.dataSource = null;
    }

    protected BaseDAO(EntityManagerFactory entityManagerFactory, DataSource dataSource) {
        this.entityManagerFactory = entityManagerFactory;
        this.dataSource = dataSource;
    }

    protected BaseDAO(DataSource dataSource) {
        this.dataSource = Objects.requireNonNull(dataSource, "dataSource must not be null");
        this.entityManagerFactory = null;
    }

    /**
     * Tạo một EntityManager mới từ EntityManagerFactory.
     * Cần đóng EntityManager sau khi sử dụng (hoặc dùng qua executeInTransaction / executeQuery).
     */
    protected EntityManager getEntityManager() {
        if (entityManagerFactory == null) {
            throw new IllegalStateException("EntityManagerFactory chưa được cấu hình cho DAO này.");
        }
        return entityManagerFactory.createEntityManager();
    }

    /**
     * Lấy một kết nối JDBC từ DataSource nếu cần thao tác native JDBC.
     */
    protected Connection getConnection() throws SQLException {
        if (dataSource == null) {
            throw new IllegalStateException("DataSource chưa được cấu hình cho DAO này.");
        }
        return dataSource.getConnection();
    }

    /**
     * Thực thi một tác vụ đọc (Query) có trả về kết quả trong ngữ cảnh EntityManager.
     */
    protected <R> R executeQuery(Function<EntityManager, R> action) {
        EntityManager em = getEntityManager();
        try {
            return action.apply(em);
        } catch (Exception e) {
            throw translateException("executeQuery", e);
        } finally {
            if (em.isOpen()) {
                em.close();
            }
        }
    }

    /**
     * Thực thi một tác vụ ghi (Insert/Update/Delete) có giao dịch tự động.
     */
    protected void executeInTransaction(Consumer<EntityManager> action) {
        EntityManager em = getEntityManager();
        EntityTransaction tx = em.getTransaction();
        try {
            tx.begin();
            action.accept(em);
            tx.commit();
        } catch (Exception e) {
            if (tx.isActive()) {
                tx.rollback();
            }
            throw translateException("executeInTransaction", e);
        } finally {
            if (em.isOpen()) {
                em.close();
            }
        }
    }

    /**
     * Thực thi một tác vụ ghi có giao dịch và trả về kết quả.
     */
    protected <R> R executeInTransaction(Function<EntityManager, R> action) {
        EntityManager em = getEntityManager();
        EntityTransaction tx = em.getTransaction();
        try {
            tx.begin();
            R result = action.apply(em);
            tx.commit();
            return result;
        } catch (Exception e) {
            if (tx.isActive()) {
                tx.rollback();
            }
            throw translateException("executeInTransaction", e);
        } finally {
            if (em.isOpen()) {
                em.close();
            }
        }
    }

    /**
     * Chuẩn hóa và bọc ngoại lệ thành DataAccessException theo luật EXC-01.
     */
    protected DataAccessException translateException(String operation, Exception e) {
        return new DataAccessException("Lỗi thao tác CSDL [" + operation + "]: " + e.getMessage(), e);
    }
}
