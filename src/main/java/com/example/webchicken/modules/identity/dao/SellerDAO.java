package com.example.webchicken.modules.identity.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import javax.sql.DataSource;

/**
 * Data Access Object cho bảng sellers.
 */
public class SellerDAO extends BaseDAO {

    public SellerDAO(DataSource dataSource) {
        super(dataSource);
    }
    // TODO: Triển khai các phương thức CRUD với PreparedStatement
}
