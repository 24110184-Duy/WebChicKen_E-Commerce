package com.example.webchicken.modules.backoffice.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import jakarta.persistence.EntityManagerFactory;

/**
 * Data Access Object cho bảng audit_logs.
 */
public class AuditLogDAO extends BaseDAO {

    public AuditLogDAO(EntityManagerFactory emf) {
        super(emf);
    }
    // TODO: Triển khai các hàm ghi và truy vấn log với PreparedStatement
}
