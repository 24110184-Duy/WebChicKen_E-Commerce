package com.example.webchicken.modules.identity.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import com.example.webchicken.modules.identity.model.entity.CustomerEntity;
import jakarta.persistence.EntityManagerFactory;
import java.util.Optional;

/** Data Access Object cho bảng {@code customers}. */
public class CustomerDAO extends BaseDAO {

    public CustomerDAO(EntityManagerFactory emf) {
        super(emf);
    }

    /** Tìm customer theo ID (cũng là user_id). */
    public Optional<CustomerEntity> findById(String customerId) {
        return executeQuery(em -> Optional.ofNullable(em.find(CustomerEntity.class, customerId)));
    }

    /** Lưu customer mới. */
    public void save(CustomerEntity customer) {
        executeInTransaction(em -> em.persist(customer));
    }

    /** Cập nhật customer. */
    public CustomerEntity update(CustomerEntity customer) {
        return executeInTransactionReturning(em -> em.merge(customer));
    }
}
