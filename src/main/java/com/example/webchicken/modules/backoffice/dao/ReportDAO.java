package com.example.webchicken.modules.backoffice.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import javax.sql.DataSource;

/**
 * Data Access Object cho báo cáo và thống kê backoffice.
 */
public class ReportDAO extends BaseDAO {

    public ReportDAO(DataSource dataSource) {
        super(dataSource);
    }
    // TODO: Triển khai các hàm truy vấn báo cáo với PreparedStatement
}
