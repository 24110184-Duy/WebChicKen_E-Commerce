package com.example.webchicken.modules.payment.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import javax.sql.DataSource;

/**
 * Data Access Object cho bảng payment_methods.
 */
public class PaymentMethodDAO extends BaseDAO {

    public PaymentMethodDAO(DataSource dataSource) {
        super(dataSource);
    }
    // TODO: Triển khai các hàm CRUD với PreparedStatement
}
