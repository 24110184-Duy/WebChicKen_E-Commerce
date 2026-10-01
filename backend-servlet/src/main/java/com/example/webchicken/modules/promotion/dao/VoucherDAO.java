package com.example.webchicken.modules.promotion.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import jakarta.persistence.EntityManagerFactory;

/**
 * Data Access Object cho bảng vouchers.
 */
public class VoucherDAO extends BaseDAO {

    public VoucherDAO(EntityManagerFactory emf) {
        super(emf);
    }
    // TODO: Triển khai các hàm CRUD với PreparedStatement
}
