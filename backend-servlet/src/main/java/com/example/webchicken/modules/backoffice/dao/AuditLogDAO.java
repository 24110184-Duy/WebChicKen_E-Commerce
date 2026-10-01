package com.example.webchicken.modules.backoffice.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import javax.sql.DataSource;

/**
 * Data Access Object cho bảng audit_logs.
 */
public class AuditLogDAO extends BaseDAO {

    public AuditLogDAO(DataSource dataSource) {
        super(dataSource);
    }
    // TODO: Triển khai các hàm ghi và truy vấn log với PreparedStatement
}
