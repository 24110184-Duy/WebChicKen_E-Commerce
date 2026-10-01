package com.example.webchicken.modules.promotion.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import javax.sql.DataSource;

/**
 * Data Access Object cho bảng vouchers.
 */
public class VoucherDAO extends BaseDAO {

    public VoucherDAO(DataSource dataSource) {
        super(dataSource);
    }
    // TODO: Triển khai các hàm CRUD với PreparedStatement
}
