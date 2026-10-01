package com.example.webchicken.modules.shop.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import javax.sql.DataSource;

/**
 * Data Access Object cho bảng stores.
 */
public class StoreDAO extends BaseDAO {

    public StoreDAO(DataSource dataSource) {
        super(dataSource);
    }
    // TODO: Triển khai các hàm CRUD với PreparedStatement
}
