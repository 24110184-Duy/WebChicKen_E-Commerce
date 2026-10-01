package com.example.webchicken.modules.catalog.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import javax.sql.DataSource;

/**
 * Data Access Object cho bảng categories.
 */
public class CategoryDAO extends BaseDAO {

    public CategoryDAO(DataSource dataSource) {
        super(dataSource);
    }
    // TODO: Triển khai các hàm CRUD với PreparedStatement
}
