package com.example.webchicken.modules.payment.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import jakarta.persistence.EntityManagerFactory;

/**
 * Data Access Object cho bảng payment_methods.
 */
public class PaymentMethodDAO extends BaseDAO {

    public PaymentMethodDAO(EntityManagerFactory emf) {
        super(emf);
    }
    // TODO: Triển khai các hàm CRUD với PreparedStatement
}
