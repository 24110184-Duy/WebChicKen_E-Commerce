package com.example.webchicken.modules.media.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import javax.sql.DataSource;

/**
 * Data Access Object cho lưu trữ và truy vấn metadata media.
 */
public class MediaDAO extends BaseDAO {

    public MediaDAO(DataSource dataSource) {
        super(dataSource);
    }
    // TODO: Triển khai các hàm CRUD với PreparedStatement
}
